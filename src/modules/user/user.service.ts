import { Injectable } from "@nestjs/common";
import { UserCreateDto } from "./dtos/user.create.dto";
import { UserRepository } from "./user.repository";
import { GetAllDto } from "src/common/base/base-dto/getall.dto";
import { UserUpdateDto } from "./dtos/user.update.dto";
import { UpdateManyDto } from "src/common/base/base-dto/update-many.dto";


@Injectable()
export class UserService {

  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async create(body: UserCreateDto) {
    return await this.userRepository.store(body);
  }

  async findAll(body: GetAllDto) {
    return await this.userRepository.findAll(body);
  }

  async findOne(id: string) {
    return await this.userRepository.findById(id);
  }

  async activate(body: UpdateManyDto) {
    return await this.userRepository.activate(body);
  }

  async inactivate(body: UpdateManyDto) {
    return await this.userRepository.inactivate(body);
  }

  async deleteUser(body: UpdateManyDto) {
    return await this.userRepository.deleteUser(body);
  }

  async updateUser(id: string, data: UserUpdateDto) {
    return await this.userRepository.updateUser(id, data);
  }
}