import { BaseEntity } from "src/common/base/base-entity/base.entity";
import { Column, Entity } from "typeorm";


@Entity({ name: "tenant" })

export class TenantEntity extends BaseEntity {
 
  @Column({ name: "name", comment: "tenant name" })
  name: string

  @Column({ name: "code" })
  code: string

  @Column({ name: "avatar",nullable:true })
  avatar: string

  @Column({ name: "description", nullable: true })
  description?: string
}