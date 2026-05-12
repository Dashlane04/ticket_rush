import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { RoleEntity } from './entity/role.entity';
import { RoleCreateDto } from './dtos/role.create.dto';
import { RoleUpdateDto } from './dtos/role.update.dto';
import { NotFoundException } from '@nestjs/common';
import { RolePermissionEntity } from './entity/role-permission.entity';
import { PermissionEntity } from './entity/permission.entity';
import { GetAllDto } from '../../common/base/base-dto/getall.dto';
import { BaseSearch } from '../../common/base/base-search/base-search';
import { ErrorEnum } from '../../common/enum/error.enum';
import { UpdateManyDto } from '../../common/base/base-dto/update-many.dto';
import { RedisService } from 'src/redis/redis.service';

export class RoleRepository extends Repository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    repo: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: RedisService,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async updatePermissionRole({
    roleId,
    toAdd,
    toRemove,
    queryRunner,
  }: {
    roleId: string;
    toAdd: string[];
    toRemove: string[];
    queryRunner: QueryRunner;
  }) {
    if (toAdd.length > 0) {
      await queryRunner.manager.insert(
        RolePermissionEntity,
        toAdd.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
      );
    }

    if (toRemove.length > 0) {
      await queryRunner.manager.delete(RolePermissionEntity, {
        role_id: roleId,
        permission_id: In(toRemove),
      });
    }
  }

  async store(body: RoleCreateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const role = queryRunner.manager.create(RoleEntity, body);
      const savedRole = await queryRunner.manager.save(role);

      await this.updatePermissionRole({
        roleId: savedRole.id,
        toAdd: body.permissions,
        toRemove: [],
        queryRunner,
      });

      await queryRunner.commitTransaction();
      return savedRole;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(body: GetAllDto) {
    const { page = 1, size = 10, query = '', sort = 1, is_active } = body;

    const qb = this.createQueryBuilder('role').where(
      'role.is_deleted = :is_deleted',
      { is_deleted: false },
    );

    if (query) {
      BaseSearch({ alias: 'role', qb, fields: ['name'], keyword: query });
    }

    if (is_active !== null && is_active !== undefined) {
      qb.andWhere('role.is_active = :is_active', { is_active });
    }

    const total = await qb.getCount();

    if (size !== -1) {
      qb.limit(size).offset((page - 1) * size);
    }

    qb.orderBy('role.created_at', sort === '1' ? 'DESC' : 'ASC');

    const data = await qb.getMany();

    return { total, page, size, data };
  }

  async findAllPermission(body: GetAllDto) {
    const { page = 0, size = 10, query = '', sort = 1, is_active } = body;

    const qb = this.dataSource
      .createQueryBuilder(PermissionEntity, 'permission')
      .where('permission.is_deleted = :is_deleted', { is_deleted: false });

    if (query) {
      BaseSearch({ alias: 'permission', qb, fields: ['name'], keyword: query });
    }

    if (is_active !== null && is_active !== undefined) {
      qb.andWhere('permission.is_active = :is_active', { is_active });
    }

    const total = await qb.getCount();

    if (size !== -1) {
      qb.limit(size).offset(page * size);
    }

    qb.orderBy('permission.name', sort === '1' ? 'DESC' : 'ASC');

    const data = await qb.getMany();

    return { total, page, size, data };
  }

  async findById(id: string) {
    const cached = await this.cacheService.get(`identity:role:${id}`);
    if (cached) return cached;

    const role = await this.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(ErrorEnum.ROLE_NOT_FOUND);
    }

    await this.cacheService.set(`identity:role:${id}`, role, 300);

    return role;
  }

  async updateRole(id: string, body: RoleUpdateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { permissions, ...updateData } = body;

      const rows = await queryRunner.manager
        .createQueryBuilder(RoleEntity, 'role')
        .where('role.id = :id', { id })
        .leftJoin('role_permission', 'rp', 'rp.role_id = role.id')
        .addSelect('rp.permission_id as permissions')
        .getRawMany();

      if (rows.length === 0) {
        throw new NotFoundException(ErrorEnum.ROLE_NOT_FOUND);
      }

      const currentPermissions = rows
        .map((item) => item.permissions)
        .filter(Boolean);
      const currentSet = new Set(currentPermissions);
      const newSet = new Set(permissions);

      const toAdd = permissions.filter((item) => !currentSet.has(item));
      const toRemove = currentPermissions.filter((item) => !newSet.has(item));

      await Promise.all([
        this.updatePermissionRole({ roleId: id, toAdd, toRemove, queryRunner }),
        queryRunner.manager.update(RoleEntity, { id }, updateData),
      ]);

      await this.cacheService.del(`identity:role:${id}`);
      await queryRunner.commitTransaction();

      return { id };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRole(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_deleted: true });
    await this.cacheService.del(ids.map((id) => `identity:role:${id}`));
    return { ids };
  }

  async activate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: true });
    await this.cacheService.del(ids.map((id) => `identity:role:${id}`));
    return { ids };
  }

  async inactivate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: false });
    await this.cacheService.del(ids.map((id) => `identity:role:${id}`));
    return { ids };
  }
}
