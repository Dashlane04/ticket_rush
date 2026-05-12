import { Injectable } from '@nestjs/common';
import { GetAllDto } from 'src/common/base/base-dto/getall.dto';
import { TenantRepository } from './tenant.repository';
import { TenantCreateDto } from './dtos/tenant.create.dto';
import { TenantUpdateDto } from './dtos/tenant.update.dto';
import { UpdateManyDto } from 'src/common/base/base-dto/update-many.dto';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async findAll(body: GetAllDto) {
    return await this.tenantRepository.findAll(body);
  }

  async findById(id: string) {
    return await this.tenantRepository.findById(id);
  }

  async create(body: TenantCreateDto) {
    return await this.tenantRepository.store(body);
  }

  async update(id: string, body: TenantUpdateDto) {
    return await this.tenantRepository.updateTenant(id, body);
  }

  async delete(body: UpdateManyDto) {
    return await this.tenantRepository.deleteTenant(body);
  }

  async inactivate(body: UpdateManyDto) {
    return await this.tenantRepository.inactivateTenant(body);
  }

  async activate(body: UpdateManyDto) {
    return await this.tenantRepository.activateTenant(body);
  }
}
