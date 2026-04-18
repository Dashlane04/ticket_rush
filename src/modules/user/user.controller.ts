import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { UserCreateDto } from "./dtos/user.create.dto";
import { UserService } from "./user.service";
import { GetAllDto } from "src/common/base/base-dto/getall.dto";
import { UserUpdateDto } from "./dtos/user.update.dto";
import { UpdateManyDto } from "src/common/base/base-dto/update-many.dto";


@ApiTags("User")
@Controller("user")
export class UserController {

  constructor(
    private readonly userService: UserService
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiQuery({ type: GetAllDto })
  async findAll(@Query() data: GetAllDto) {
    return this.userService.findAll(data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one user by ID" })
  @ApiParam({ name: "id", type: String })
  async findOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a user" })
  @ApiBody({ type: UserCreateDto })
  async create(@Body() data: UserCreateDto) {
    return this.userService.create(data);
  }

  @Put("activate")
  @ApiOperation({ summary: "Activate users" })
  @ApiBody({ type: UpdateManyDto })
  async activate(@Body() data: UpdateManyDto) {
    return this.userService.activate(data);
  }

  @Put("inactivate")
  @ApiOperation({ summary: "Inactivate users" })
  @ApiBody({ type: UpdateManyDto })
  async inactivate(@Body() data: UpdateManyDto) {
    return this.userService.inactivate(data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a user" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: UserUpdateDto })
  async updateUser(@Param("id") id: string, @Body() data: UserUpdateDto) {
    return this.userService.updateUser(id, data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete users" })
  @ApiBody({ type: UpdateManyDto })
  async deleteUser(@Body() data: UpdateManyDto) {
    return this.userService.deleteUser(data);
  }
}