import { DataSource, In, Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCreateDto } from './dtos/user.create.dto';
import { GetAllDto } from 'src/common/base/base-dto/getall.dto';
import { BaseSearch } from 'src/common/base/base-search/base-search';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ErrorEnum } from 'src/common/enum/error.enum';
import { UserUpdateDto } from './dtos/user.update.dto';
import { QueryRunner } from 'typeorm';
import { UserRoleEntity } from '../role/entity/user-role.entity';
import { RedisService } from 'src/redis/redis.service';
import { UpdateManyDto } from 'src/common/base/base-dto/update-many.dto';
import * as bcrypt from 'bcrypt';
import { Ticket } from 'src/modules/tickets/entities/tickets.entity';
import { Showtime } from 'src/modules/tickets/entities/showtime.entity';

/** Chuẩn hoá boolean từ getRawMany/getRawOne (PG có thể trả boolean, 't'/'f', chuỗi). */
function normalizeUserIsActive(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1' || s === 'yes';
  }
  return false;
}

function mapRawUserListRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name != null ? String(row.name) : null,
    email: String(row.email),
    phone: row.phone != null ? String(row.phone) : null,
    gender: row.gender != null ? String(row.gender) : null,
    date_of_birth: row.date_of_birth != null ? new Date(row.date_of_birth as string).toISOString() : null,
    is_active: normalizeUserIsActive(row.is_active),
  };
}

export class UserRepository extends Repository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    repo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly cacheService: RedisService,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async updateRelation(
    userId: string,
    toAdd: string[],
    toRemove: string[],
    queryRunner: QueryRunner,
  ) {
    const actions: Promise<any>[] = [];

    if (toAdd.length > 0) {
      actions.push(
        queryRunner.manager.insert(
          UserRoleEntity,
          toAdd.map((roleId) => ({ user_id: userId, role_id: roleId })),
        ),
      );
    }

    if (toRemove.length > 0) {
      actions.push(
        queryRunner.manager.delete(UserRoleEntity, {
          user_id: userId,
          role_id: In(toRemove),
        }),
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

    const qb = this.createQueryBuilder('user')
      .select([
        'user.id as id',
        'user.name as name',
        'user.email as email',
        'user.phone as phone',
        'user.gender as gender',
        'user.date_of_birth as date_of_birth',
        'user.is_active as is_active',
      ])
      .where('user.is_deleted = :is_deleted', { is_deleted: false });

    if (query) {
      BaseSearch({ alias: 'user', qb, fields: ['name', 'email', 'phone'], keyword: query });
    }

    if (is_active !== null && is_active !== undefined) {
      qb.andWhere('user.is_active = :is_active', { is_active });
    }

    const total = await qb.getCount();

    if (size !== -1) {
      qb.take(size).skip(page * size);
    }

    qb.orderBy('user.created_at', sort === '1' ? 'DESC' : 'ASC');

    const rawRows = await qb.getRawMany();
    const data = rawRows.map((r) =>
      mapRawUserListRow(r as Record<string, unknown>),
    );

    return { total, page, size, data };
  }

  async findById(id: string) {
    const cached = await this.cacheService.get(`identity:user:${id}`);
    if (cached) {
      return mapRawUserListRow(cached as Record<string, unknown>);
    }

    const user = await this.createQueryBuilder('user')
      .select([
        'user.id as id',
        'user.name as name',
        'user.email as email',
        'user.phone as phone',
        'user.gender as gender',
        'user.date_of_birth as date_of_birth',
        'user.is_active as is_active',
      ])
      .where('user.is_deleted = :is_deleted', { is_deleted: false })
      .andWhere('user.id = :id', { id })
      .getRawOne();

    if (!user) {
      throw new NotFoundException(ErrorEnum.USER_NOT_FOUND);
    }

    const mapped = mapRawUserListRow(user as Record<string, unknown>);
    await this.cacheService.set(`identity:user:${id}`, mapped, 300);

    return mapped;
  }

  async findByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }

  async findRoleNamesByUserId(userId: string): Promise<string[]> {
    const rows = await this.createQueryBuilder('user')
      .select('r.name', 'name')
      .innerJoin('user_role', 'ur', 'ur.user_id = user.id')
      .innerJoin('role', 'r', 'r.id = ur.role_id')
      .where('user.id = :userId', { userId })
      .andWhere('user.is_deleted = :is_deleted', { is_deleted: false })
      .getRawMany();
    return rows
      .map((row: { name?: string }) => row.name)
      .filter(Boolean) as string[];
  }

  async findByPhone(phone: string) {
    return await this.findOne({ where: { phone } });
  }

  async activate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: true });
    await this.cacheService.del(ids.map((id) => `identity:user:${id}`));
    return { ids };
  }

  async inactivate(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_active: false });
    await this.cacheService.del(ids.map((id) => `identity:user:${id}`));
    return { ids };
  }

  async deleteUser(body: UpdateManyDto) {
    const { ids } = body;
    await this.update({ id: In(ids) }, { is_deleted: true });
    await this.cacheService.del(ids.map((id) => `identity:user:${id}`));
    return { ids };
  }

  async updateUser(id: string, data: UserUpdateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { roles, password, gender, date_of_birth, ...restScalar } = data;

      const patch: Record<string, unknown> = {};
      for (const key of ['name', 'email', 'phone'] as const) {
        const v = restScalar[key];
        if (v !== undefined) {
          patch[key] = v;
        }
      }
      if (gender !== undefined) {
        patch.gender = gender;
      }
      if (date_of_birth !== undefined) {
        patch.date_of_birth = new Date(date_of_birth);
      }
      if (password !== undefined && password !== '') {
        patch.password = await bcrypt.hash(password, 10);
      }

      const rows = await queryRunner.manager
        .createQueryBuilder(UserEntity, 'user')
        .where('user.id = :id', { id })
        .andWhere('user.is_deleted = :is_deleted', { is_deleted: false })
        .leftJoin('user_role', 'ur', 'ur.user_id = user.id')
        .addSelect('ur.role_id', 'roles')
        .getRawMany();

      if (rows.length === 0) {
        throw new NotFoundException(ErrorEnum.USER_NOT_FOUND);
      }

      const currentRoles = rows.map((item) => item.roles).filter(Boolean);
      const tasks: Promise<unknown>[] = [];

      if (roles !== undefined) {
        const currentSet = new Set(currentRoles);
        const toAdd = roles.filter((item) => !currentSet.has(item));
        const toRemove = currentRoles.filter((item) => !roles.includes(item));
        tasks.push(this.updateRelation(id, toAdd, toRemove, queryRunner));
      }

      if (Object.keys(patch).length > 0) {
        tasks.push(queryRunner.manager.update(UserEntity, { id }, patch));
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
      }

      await queryRunner.commitTransaction();
      await this.cacheService.del(`identity:user:${id}`);

      return { id };
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (error.code === '23505') {
        throw new BadRequestException('Email hoặc số điện thoại này đã được sử dụng bởi tài khoản khác.');
      }
      throw new InternalServerErrorException(error.message || String(error));
    } finally {
      await queryRunner.release();
    }
  }
  async getUserTelemetry(userId: string) {
    let age: number | null = null;
    try {
      const user = await this.findById(userId);
      if (user.date_of_birth) {
        const dob = new Date(user.date_of_birth);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        age = Math.abs(ageDt.getUTCFullYear() - 1970);
      }
    } catch (err) {
      console.error('[getUserTelemetry] Error fetching user:', err);
    }

    let totalPurchases = 0;
    let totalSpent = 0;
    let avgTicketPrice = 0;
    let lastPurchaseDate: string | null = null;
    let sortedPreferences: { name: string; count: number }[] = [];
    let purchaseHistory: { month: string; count: number; spent: number }[] = [];

    try {
      const ticketRepo = this.dataSource.getRepository(Ticket);
      const showtimeRepo = this.dataSource.getRepository(Showtime);

      const tickets = await ticketRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      const showtimeIds = [...new Set(tickets.map((t) => t.showtimeId))];
      const showtimes =
        showtimeIds.length > 0
          ? await showtimeRepo.findBy({ id: In(showtimeIds) })
          : [];
      const showtimeMap = new Map(showtimes.map((s) => [s.id, s]));

      const categoryCounts: Record<string, number> = {};
      const monthlyData: Record<string, { count: number; spent: number }> = {};

      for (const t of tickets) {
        const price = parseFloat(String(t.price)) || 0;
        totalPurchases += 1;
        totalSpent += price;

        const showtime = showtimeMap.get(t.showtimeId);
        const cat = showtime?.category || 'Khác';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        // Group by month for purchase history chart
        const d = new Date(t.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, spent: 0 };
        }
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].spent += price;
      }

      if (tickets.length > 0) {
        avgTicketPrice = totalSpent / totalPurchases;
        lastPurchaseDate = tickets[0].createdAt.toISOString();
      }

      sortedPreferences = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      // Sort months chronologically, keep last 6
      purchaseHistory = Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, data]) => ({ month, ...data }));
    } catch (err) {
      console.error('[getUserTelemetry] Error querying tickets:', err);
    }

    return {
      age,
      totalPurchases,
      totalSpent,
      avgTicketPrice,
      lastPurchaseDate,
      preferences: sortedPreferences,
      purchaseHistory,
    };
  }
}
