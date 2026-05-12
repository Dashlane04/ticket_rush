import { BaseEntity } from 'src/common/base/base-entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'role' })
export class RoleEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'tenant', type: 'uuid', nullable: true })
  tenant: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;
}
