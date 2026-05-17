import { BaseEntity } from 'src/common/base/base-entity/base.entity';
import { Column, Entity } from 'typeorm';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', nullable: true })
  name?: string;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar' })
  password: string;

  @Column({ name: 'phone', type: 'varchar', unique: true, nullable: true })
  phone?: string;

  @Column({ name: 'avatar', type: 'varchar', nullable: true })
  avatar?: string;

  @Column({ name: 'gender', type: 'varchar', nullable: true })
  gender?: GenderEnum;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  date_of_birth?: Date;
}
