import { Controller, Delete, Post, Get, Body, Param } from '@nestjs/common';

import { AdminService } from './admin.service';
import { SaveSeatTemplateDto } from './dto/save-seat-template.dto';
import { CreateShowtimeDto } from './dto/create-showtime.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('showtime')
  async createShowtime(@Body() body: CreateShowtimeDto) {
    return await this.adminService.createShowtime(body);
  }

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

  @Post('showtime/:id/apply-template')
  async applyTemplateToShowtime(@Param('id') showtimeId: string, @Body() body: { templateId: string }) {
    return await this.adminService.applyTemplateToShowtime(showtimeId, body.templateId);
  }

  @Delete('seat-template/:id')
  async deleteSeatTemplate(@Param('id') id: string) {
    return this.adminService.deleteSeatTemplate(id);
  }

  @Get('showtimes')
  async getShowtimes() {
    return await this.adminService.getShowtimes();
  }

  @Delete('showtime/:id')
  async deleteShowtime(@Param('id') id: string) {
    return this.adminService.deleteShowtime(id);
  }

  @Post('showtime/:showtimeId/seat/:seatId/override')
  async overrideSeatStatus(
    @Param('showtimeId') showtimeId: string,
    @Param('seatId') seatId: string,
    @Body('status') status: string,
  ) {
    return this.adminService.overrideSeatStatus(showtimeId, seatId, status);
  }
}
