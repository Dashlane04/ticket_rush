import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

export abstract class BaseEntity {

  @ApiProperty({
    name: 'id',
    type: String
  })
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ApiProperty({
    name: 'created_at',
    type: Date
  })
  @CreateDateColumn({ name: 'created_at', type: 'date' })
  created_at: Date

  @ApiPropertyOptional({
    name: "created_by",
    type: String
  })
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string

  @ApiPropertyOptional({
    name: 'updated_at',
    type: Date
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'date', nullable: true })
  updated_at: Date

  @ApiPropertyOptional({
    name: "updated_by",
    type: String
  })
  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updated_by: string

  @ApiProperty({
    name: 'is_deleted',
    type: Boolean
  })
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean


  @ApiProperty({
    name:"is_active",
    type: Boolean
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean

}