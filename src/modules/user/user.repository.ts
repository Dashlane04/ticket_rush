import { DataSource, In, Repository } from "typeorm";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserCreateDto } from "./dtos/user.create.dto";
import { GetAllDto } from "src/common/base/base-dto/getall.dto";
import { BaseSearch } from "src/common/base/base-search/base-search";
import { NotFoundException } from "@nestjs/common";
import { ErrorEnum } from "src/common/enum/error.enum";
import { UserUpdateDto } from "./dtos/user.update.dto";
import { QueryRunner } from "typeorm";
import { UserRoleEntity } from "../role/entity/user-role.entity";
import { RedisService } from "src/redis/redis.service";
import { UpdateManyDto } from "src/common/base/base-dto/update-many.dto";
import * as bcrypt from "bcrypt";


export class UserRepository extends Repository<UserEntity> {

  constructor(
    @InjectRepository(UserEntity)
    repo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: RedisService
  ) {
    super(repo.target, repo.manager, repo.queryRunner)
  }

  async updateRelation(userId: string, toAdd: string[], toRemove: string[], queryRunner: QueryRunner) {
    const actions: Promise<any>[] = [];

    if (toAdd.length > 0) {
      actions.push(
        queryRunner.manager.insert(UserRoleEntity,
          toAdd.map(roleId => ({ user_id: userId, role_id: roleId }))
        )
      );
    }

    if (toRemove.length > 0) {
      actions.push(
        queryRunner.manager.delete(UserRoleEntity, {
          user_id: userId,
          role_id: In(toRemove)
        })
      );
    }

    await Promise.all(actions);
  }

  async store(body: UserCreateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { roles, password, ...rest } = body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = queryRunner.manager.create(UserEntity, {
        ...rest,
        password: hashedPassword,
      });

      const savedUser = await queryRunner.manager.save(user);

      await this.updateRelation(savedUser.id, roles ?? [], [], queryRunner);
      await queryRunner.commitTransaction();

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(body: GetAllDto) {
    const { page = 0, size = 10, query = '', sort = 1, is_active } = body;

    const qb = this.createQueryBuilder("user")
      .select([
        "user.id as id",
        "user.name as name",
        "user.email as email",
        "user.phone as phone",
        "user.is_active as is_active",
      ])
      .where("user.is_deleted = :is_deleted", { is_deleted: false })
      .leftJoin("tenant", "t", "t.id = user.tenant")
      .addSelect("t.name as university");

    if (query) {
      BaseSearch({ alias: "user", qb, fields: ['name'], keyword: query });
    }

    if (is_active !== null && is_active !== undefined) {
      qb.andWhere("user.is_active = :is_active", { is_active });
    }

    const total = await qb.getCount();

    if (size !== -1) {
      qb.take(size).skip(page * size);
    }

    qb.orderBy("user.created_at", sort === '1' ? 'DESC' : 'ASC');

    const data = await qb.getRawMany();

    return { total, page, size, data };
  }

  async findById(id: string) {
    const cached = await this.cacheService.get(`identity:user:${id}`);
    if (cached) return cached;

    const user = await this.createQueryBuilder('user')
      .select([
        "user.id as id",
        "user.name as name",
        "user.email as email",
        "user.phone as phone",
        "user.is_active as is_active",
      ])
      .where("user.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("user.id = :id", { id })
      .leftJoin("tenant", "t", "t.id = user.tenant")
      .addSelect("t.name as university")
      .getRawOne();

    if (!user) {
      throw new NotFoundException(ErrorEnum.USER_NOT_FOUND);
    }

    await this.cacheService.set(`identity:user:${id}`, user, 300);

    return user;
  }

  async findByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }

  async activate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: true });
    await this.cacheService.del(ids.map(id => `identity:user:${id}`));
    return { ids };
  }

  async inactivate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: false });
    await this.cacheService.del(ids.map(id => `identity:user:${id}`));
    return { ids };
  }

  async deleteUser(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_deleted: true });
    await this.cacheService.del(ids.map(id => `identity:user:${id}`));
    return { ids };
  }

  async updateUser(id: string, data: UserUpdateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { roles = [], ...updateData } = data;

      const rows = await queryRunner.manager.createQueryBuilder(UserEntity, 'user')
        .where("user.id = :id", { id })
        .andWhere("user.is_deleted = :is_deleted", { is_deleted: false })
        .leftJoin("user_role", 'ur', 'ur.user_id = user.id')
        .addSelect("ur.role_id", "roles")
        .getRawMany();

      if (rows.length === 0) {
        throw new NotFoundException(ErrorEnum.USER_NOT_FOUND);
      }

      const currentRoles = rows.map(item => item.roles).filter(Boolean);
      const currentSet = new Set(currentRoles);
      const newSet = new Set(roles);

      const toAdd = roles.filter(item => !currentSet.has(item));
      const toRemove = currentRoles.filter(item => !newSet.has(item));

      await Promise.all([
        this.updateRelation(id, toAdd, toRemove, queryRunner),
        queryRunner.manager.update(UserEntity, { id }, updateData),
      ]);

      await queryRunner.commitTransaction();
      await this.cacheService.del(`identity:user:${id}`);

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
}