import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { RoleService } from "./role.service";
import { RoleCreateDto } from "./dtos/role.create.dto";
import { RoleUpdateDto } from "./dtos/role.update.dto";
import { GetAllDto } from "../../common/base/base-dto/getall.dto";
import { UpdateManyDto } from "../../common/base/base-dto/update-many.dto";

@ApiTags("Role")
@Controller("role")
export class RoleController {

  constructor(
    private readonly roleService: RoleService
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all roles" })
  @ApiQuery({ type: GetAllDto })
  async findAll(@Query() data: GetAllDto) {
    return await this.roleService.findAll(data);
  }

  @Get("permission")
  @ApiOperation({ summary: "Get all permissions" })
  @ApiQuery({ type: GetAllDto })
  async findAllPermission(@Query() data: GetAllDto) {
    return await this.roleService.findAllPermission(data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one role by ID" })
  @ApiParam({ name: "id", type: String })
  async findOne(@Param("id") id: string) {
    return await this.roleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a role" })
  @ApiBody({ type: RoleCreateDto })
  @ApiResponse({ status: 201, description: "Role created" })
  async create(@Body() data: RoleCreateDto) {
    return await this.roleService.create(data);
  }

  @Put("activate")
  @ApiOperation({ summary: "Activate roles" })
  @ApiBody({ type: UpdateManyDto })
  async activate(@Body() data: UpdateManyDto) {
    return await this.roleService.activate(data);
  }

  @Put("inactivate")
  @ApiOperation({ summary: "Inactivate roles" })
  @ApiBody({ type: UpdateManyDto })
  async inactivate(@Body() data: UpdateManyDto) {
    return await this.roleService.inactivate(data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a role" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: RoleUpdateDto })
  async update(@Param("id") id: string, @Body() data: RoleUpdateDto) {
    return await this.roleService.update(id, data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete roles" })
  @ApiBody({ type: UpdateManyDto })
  async delete(@Body() data: UpdateManyDto) {
    return await this.roleService.delete(data);
  }
}