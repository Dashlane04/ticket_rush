import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'role_permission' })
export class RolePermissionEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  role_id: string;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permission_id: string;
}
