import { BaseEntity } from "src/common/base/base-entity/base.entity";
import { Column, Entity } from "typeorm";

export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

@Entity({ name: "user" })
export class UserEntity extends BaseEntity {

  @Column({ name: "keycloak_id", type: "varchar", unique: true })
  keycloak_id: string;

  @Column({ name: "tenant", type: "uuid", nullable: true })
  tenant: string | null;

  @Column({ name: "name", type: "varchar", nullable: true })
  name?: string;

  @Column({ name: "email", type: "varchar", unique: true })
  email: string;

  @Column({ name: "phone", type: "varchar", unique: true, nullable: true })
  phone?: string;

  @Column({ name: "avatar", type: "varchar", nullable: true })
  avatar?: string;

  @Column({ name: "gender", type: "varchar", nullable: true, enum: GenderEnum })
  gender?: GenderEnum;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  date_of_birth?: Date;
}