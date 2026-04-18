import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/base/base-entity/base.entity";

@Entity({ name: 'permission' })
export class PermissionEntity extends BaseEntity {

  @Column({ name: "name", type: "varchar" })
  name: string;

  @Column({ name: "description", type: 'text', nullable: true })
  description?: string;
}