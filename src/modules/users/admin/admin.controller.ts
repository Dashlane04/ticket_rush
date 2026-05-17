import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ADMIN_ROLE_NAME } from '../../auth/admin-role.constant';

import { AdminService } from './admin.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { SaveSeatTemplateDto } from './dto/save-seat-template.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Request } from 'express';
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    tenant_id: string;
    roles: string[];
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping-auth')
  async pingAuth(@Req() req: RequestWithUser) {
    const cookieHeader = req.headers?.cookie;
    let extracted: string | null = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c: string) => c.trim());
      const accessCookie = cookies.find((c: string) => c.startsWith('access_token='));
      if (accessCookie) extracted = accessCookie.substring('access_token='.length);
    }
    return {
      cookieHeader,
      extracted,
      user: req.user,
    };
  }

  /** Promo Codes */
  @Post('promo-codes')
  async createPromoCode(@Body() body: { code: string; discountPercent: number; maxUses?: number; validUntil?: string }) {
    return this.adminService.createPromoCode(body);
  }

  @Get('promo-codes')
  async getPromoCodes() {
    return this.adminService.listPromoCodes();
  }

  @Patch('promo-codes/:id')
  async updatePromoCode(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; discountPercent?: number; maxUses?: number | null; validUntil?: string | null },
  ) {
    return this.adminService.updatePromoCode(id, body);
  }

  @Delete('promo-codes/:id')
  async deletePromoCode(@Param('id') id: string) {
    return this.adminService.deletePromoCode(id);
  }

  /** REST aliases: same payloads as `showtime/*` (one showtime = one event in the app). */

  @Post('seat-template')
  async saveSeatTemplate(@Body() body: SaveSeatTemplateDto) {
    return await this.adminService.saveSeatTemplate(body);
  }

  @Get('seat-templates')
  async getSeatTemplates() {
    return await this.adminService.getSeatTemplates();
  }

  @Get('seat-template/:id')
  async getTemplateDetails(@Param('id') id: string) {
    return this.adminService.getTemplateDetails(id);
  }

  @Put('seat-template/:id')
  async replaceSeatTemplate(
    @Param('id') id: string,
    @Body() body: SaveSeatTemplateDto,
  ) {
    return this.adminService.replaceSeatTemplate(id, body);
  }

  @Delete('seat-template/:id')
  async deleteSeatTemplate(@Param('id') id: string) {
    return this.adminService.deleteSeatTemplate(id);
  }
  @Get('events')
  async getEvents() {
    return await this.adminService.getShowtimes();
  }

  @Post('events')
  async createEvent(@Body() body: CreateShowtimeDto) {
    return await this.adminService.createShowtime(body);
  }

  @Post('events/:id/apply-template')
  async applyTemplateToEvent(
    @Param('id') showtimeId: string,
    @Body() body: { templateId: string },
  ) {
    return await this.adminService.applyTemplateToShowtime(
      showtimeId,
      body.templateId,
    );
  }

  @Get('events/:id')
  async getEvent(@Param('id') id: string) {
    return await this.adminService.getShowtimeById(id);
  }

  @Put('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() body: UpdateShowtimeDto,
  ) {
    return await this.adminService.updateShowtime(id, body);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string) {
    return await this.adminService.deleteShowtime(id);
  }

  @Post('events/:showtimeId/seat/:seatId/override')
  async overrideSeatStatusForEvent(
    @Param('showtimeId') showtimeId: string,
    @Param('seatId') seatId: string,
    @Body('status') status: string,
  ) {
    return this.adminService.overrideSeatStatus(showtimeId, seatId, status);
  }

  @Get('live-users')
  async getLiveUsers() {
    return this.adminService.getLiveUsersCount();
  }

  @Get('users/stats')
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('purchase-stats')
  async getPurchaseStats() {
    return this.adminService.getPurchaseStats();
  }

  @Get('config/queue-threshold')
  async getQueueThreshold() {
    return this.adminService.getQueueThreshold();
  }

  @Patch('config/queue-threshold')
  async updateQueueThreshold(@Body('threshold') threshold: number) {
    return this.adminService.updateQueueThreshold(threshold);
  }

  @Post('config/queue-reset')
  async resetAllQueues() {
    return this.adminService.resetAllQueues();
  }
}
