import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_role' })
export class UserRoleEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  role_id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
