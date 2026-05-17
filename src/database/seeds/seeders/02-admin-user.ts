import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ADMIN_ROLE_NAME } from 'src/modules/auth/admin-role.constant';
import { RoleEntity } from 'src/modules/role/entity/role.entity';
import { UserRoleEntity } from 'src/modules/role/entity/user-role.entity';
import { UserEntity } from 'src/modules/user/entity/user.entity';
import { AbstractSeeder } from './abstract.seeder';

const ADMIN_EMAIL = 'admintest@gmail.com';
const ADMIN_PASSWORD = 'admin123456';

@Injectable()
export class AdminUserSeeder extends AbstractSeeder {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
  ) {
    super();
  }

  async run() {
    let adminRole = await this.roleRepo.findOne({
      where: { name: ADMIN_ROLE_NAME },
    });

    if (!adminRole) {
      adminRole = await this.roleRepo.save(
        this.roleRepo.create({
          name: ADMIN_ROLE_NAME,
          description: 'Quản trị (seed)',
        }),
      );
      this.log(`Role "${ADMIN_ROLE_NAME}"`, 'seeded');
    } else {
      this.log(`Role "${ADMIN_ROLE_NAME}"`, 'skipped');
    }

    let user = await this.userRepo.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (!user) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await this.userRepo.save(
        this.userRepo.create({
          name: 'Admin Test',
          email: ADMIN_EMAIL,
          password: hashed,
        }),
      );
      this.log(`User ${ADMIN_EMAIL}`, 'seeded');
    } else {
      this.log(`User ${ADMIN_EMAIL}`, 'skipped');
    }

    const existingLink = await this.userRoleRepo.findOne({
      where: { user_id: user.id, role_id: adminRole.id },
    });

    if (!existingLink) {
      await this.userRoleRepo.save(
        this.userRoleRepo.create({
          user_id: user.id,
          role_id: adminRole.id,
        }),
      );
      this.log(`user_role (${ADMIN_EMAIL} ↔ ${ADMIN_ROLE_NAME})`, 'seeded');
    } else {
      this.log(`user_role (${ADMIN_EMAIL} ↔ ${ADMIN_ROLE_NAME})`, 'skipped');
    }
  }
}