import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { TenantService } from "./tenant.service";
import { GetAllDto } from "src/common/base/base-dto/getall.dto";
import { TenantCreateDto } from "./dtos/tenant.create.dto";
import { TenantUpdateDto } from "./dtos/tenant.update.dto";
import { UpdateManyDto } from "src/common/base/base-dto/update-many.dto";


@ApiTags("Tenant")
@Controller("tenant")
export class TenantController {

  constructor(
    private readonly tenantService: TenantService
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all tenants" })
  @ApiQuery({ type: GetAllDto })
  async findAll(@Query() data: GetAllDto) {
    return this.tenantService.findAll(data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one tenant by ID" })
  @ApiParam({ name: "id", type: String })
  async findById(@Param("id") id: string) {
    return this.tenantService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a tenant" })
  @ApiBody({ type: TenantCreateDto })
  async create(@Body() data: TenantCreateDto) {
    return this.tenantService.create(data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a tenant" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: TenantUpdateDto })
  async update(@Param("id") id: string, @Body() data: TenantUpdateDto) {
    return this.tenantService.update(id, data);
  }

  @Put("activate")
  @ApiOperation({ summary: "Activate tenants" })
  @ApiBody({ type: UpdateManyDto })
  async activate(@Body() data: UpdateManyDto) {
    return this.tenantService.activate(data);
  }

  @Put("inactivate")
  @ApiOperation({ summary: "Inactivate tenants" })
  @ApiBody({ type: UpdateManyDto })
  async inactivate(@Body() data: UpdateManyDto) {
    return this.tenantService.inactivate(data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete tenants" })
  @ApiBody({ type: UpdateManyDto })
  async delete(@Body() data: UpdateManyDto) {
    return this.tenantService.delete(data);
  }
}