import { Injectable } from "@nestjs/common";
import { GetAllDto } from "../../common/base/base-dto/getall.dto";
import { RoleRepository } from "./role.repository";
import { RoleCreateDto } from "./dtos/role.create.dto";
import { RoleUpdateDto } from "./dtos/role.update.dto";
import { UpdateManyDto } from "../../common/base/base-dto/update-many.dto";


@Injectable()
export class RoleService {

  constructor(
    private readonly roleRepository: RoleRepository
  ) {}

  async findAll(body: GetAllDto) {
    return await this.roleRepository.findAll(body);
  }

  async findAllPermission(body: GetAllDto) {
    return await this.roleRepository.findAllPermission(body);
  }

  async findOne(id: string) {
    return await this.roleRepository.findById(id);
  }

  async create(body: RoleCreateDto) {
    return await this.roleRepository.store(body);
  }

  async update(id: string, body: RoleUpdateDto) {
    return await this.roleRepository.updateRole(id, body);
  }

  async activate(body: UpdateManyDto) {
    return await this.roleRepository.activate(body);
  }

  async inactivate(body: UpdateManyDto) {
    return await this.roleRepository.inactivate(body);
  }

  async delete(body: UpdateManyDto) {
    return await this.roleRepository.deleteRole(body);
  }
}