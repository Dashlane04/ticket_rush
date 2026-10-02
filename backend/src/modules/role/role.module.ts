import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entity/role.entity';
import { PermissionEntity } from './entity/permission.entity';
import { UserRoleEntity } from './entity/user-role.entity';
import { RolePermissionEntity } from './entity/role-permission.entity';
import { RoleRepository } from './role.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      UserRoleEntity,
      RolePermissionEntity,
    ]),
    AuthModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
})
export class RoleModule {}
