import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserService } from './user.service';
import { GetAllDto } from 'src/common/base/base-dto/getall.dto';
import { UserUpdateDto } from './dtos/user.update.dto';
import { UpdateManyDto } from 'src/common/base/base-dto/update-many.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ADMIN_ROLE_NAME } from '../auth/admin-role.constant';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    tenant_id: string;
    roles: string[];
  };
}

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.userService.findOne(req.user.id);
  }

  @Put('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UserUpdateDto })
  async updateMyProfile(@Req() req: RequestWithUser, @Body() data: UserUpdateDto) {
    return this.userService.updateUser(req.user.id, data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ type: GetAllDto })
  async findAll(@Query() data: GetAllDto) {
    return this.userService.findAll(data);
  }

  @Get(':id/telemetry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Get user telemetry data' })
  @ApiParam({ name: 'id', type: String })
  async getUserTelemetry(@Param('id') id: string) {
    return this.userService.getUserTelemetry(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Get one user by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({ type: UserCreateDto })
  async create(@Body() data: UserCreateDto) {
    return this.userService.create(data);
  }

  @Put('activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Activate users' })
  @ApiBody({ type: UpdateManyDto })
  async activate(@Body() data: UpdateManyDto) {
    return this.userService.activate(data);
  }

  @Put('inactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Inactivate users' })
  @ApiBody({ type: UpdateManyDto })
  async inactivate(@Body() data: UpdateManyDto) {
    return this.userService.inactivate(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UserUpdateDto })
  async updateUser(@Param('id') id: string, @Body() data: UserUpdateDto) {
    return this.userService.updateUser(id, data);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE_NAME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete users' })
  @ApiBody({ type: UpdateManyDto })
  async deleteUser(@Body() data: UpdateManyDto) {
    return this.userService.deleteUser(data);
  }

}
