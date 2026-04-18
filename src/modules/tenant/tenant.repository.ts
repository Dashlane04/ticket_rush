import { In, Repository } from "typeorm";
import { TenantEntity } from "./entity/tenant.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseSearch } from "src/common/base/base-search/base-search";
import { GetAllDto } from "src/common/base/base-dto/getall.dto";
import { TenantCreateDto } from "./dtos/tenant.create.dto";
import { TenantUpdateDto } from "./dtos/tenant.update.dto";
import { NotFoundException } from "@nestjs/common";
import { ErrorEnum } from "../../common/enum/error.enum";
import { RedisService } from "src/redis/redis.service";
import { UpdateManyDto } from "src/common/base/base-dto/update-many.dto";


export class TenantRepository extends Repository<TenantEntity> {

  constructor(
    @InjectRepository(TenantEntity)
    repo: Repository<TenantEntity>,
    private readonly cacheService: RedisService
  ) {
    super(repo.target, repo.manager, repo.queryRunner)
  }

  async store(body: TenantCreateDto) {
    const tenant = this.create(body);
    const saved = await this.save(tenant);
    return saved;
  }

  async findAll(body: GetAllDto) {
    const { page = 0, size = 10, query = '', sort = 1, is_active } = body;

    const qb = this.createQueryBuilder('tenant')
      .where("tenant.is_deleted = :is_deleted", { is_deleted: false });

    if (query) {
      BaseSearch({ alias: "tenant", qb, fields: ['name', 'code'], keyword: query });
    }

    if (is_active !== null && is_active !== undefined) {
      qb.andWhere("tenant.is_active = :is_active", { is_active });
    }

    const total = await qb.getCount();

    if (size !== -1) {
      qb.limit(size).offset(page * size);
    }

    qb.orderBy("tenant.created_at", sort === '1' ? 'DESC' : 'ASC');

    const data = await qb.getMany();

    return { total, page, size, data };
  }

  async findById(id: string) {
    const cached = await this.cacheService.get(`identity:tenant:${id}`);
    if (cached) return cached;

    const tenant = await this.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(ErrorEnum.TENANT_NOT_FOUND);
    }

    await this.cacheService.set(`identity:tenant:${id}`, tenant, 300);

    return tenant;
  }

  async updateTenant(id: string, body: TenantUpdateDto) {
    const tenant = await this.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(ErrorEnum.TENANT_NOT_FOUND);
    }

    Object.assign(tenant, body);
    await this.save(tenant);

    await this.cacheService.set(`identity:tenant:${id}`, {
      id,
      name: tenant.name,
      code: tenant.code,
      avatar: tenant.avatar,
      is_active: tenant.is_active,
    }, 300);

    return { id };
  }

  async deleteTenant(body: UpdateManyDto) {
    const { ids } = body;

    await this.update({ id: In(ids) }, { is_deleted: true });
    await this.cacheService.del(ids.map(id => `identity:tenant:${id}`));

    return { ids };
  }

  async inactivateTenant(body: UpdateManyDto) {
    const { ids } = body;

    await this.update({ id: In(ids) }, { is_active: false });
    await this.cacheService.del(ids.map(id => `identity:tenant:${id}`));

    return { ids };
  }

  async activateTenant(body: UpdateManyDto) {
    const { ids } = body;

    await this.update({ id: In(ids) }, { is_active: true });
    await this.cacheService.del(ids.map(id => `identity:tenant:${id}`));

    return { ids };
  }
}