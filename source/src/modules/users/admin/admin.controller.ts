import { Controller, Post, Get, Body, Param } from '@nestjs/common';

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

  @Post('showtime/:id/apply-template')
  async applyTemplateToShowtime(@Param('id') showtimeId: string, @Body() body: { templateId: string }) {
    return await this.adminService.applyTemplateToShowtime(showtimeId, body.templateId);
  }

  @Get('showtimes')
  async getShowtimes() {
    return await this.adminService.getShowtimes();
  }
}
