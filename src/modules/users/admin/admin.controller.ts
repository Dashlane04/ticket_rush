import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

import { AdminService } from './admin.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { SaveSeatTemplateDto } from './dto/save-seat-template.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

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

  @Put('seat-template/:id')
  async replaceSeatTemplate(
    @Param('id') id: string,
    @Body() body: SaveSeatTemplateDto,
  ) {
    return this.adminService.replaceSeatTemplate(id, body);
  }

  @Post('showtime/:id/apply-template')
  async applyTemplateToShowtime(
    @Param('id') showtimeId: string,
    @Body() body: { templateId: string },
  ) {
    return await this.adminService.applyTemplateToShowtime(
      showtimeId,
      body.templateId,
    );
  }

  @Delete('seat-template/:id')
  async deleteSeatTemplate(@Param('id') id: string) {
    return this.adminService.deleteSeatTemplate(id);
  }

  @Get('showtimes')
  async getShowtimes() {
    return await this.adminService.getShowtimes();
  }

  @Get('showtime/:id')
  async getShowtime(@Param('id') id: string) {
    return await this.adminService.getShowtimeById(id);
  }

  @Put('showtime/:id')
  async updateShowtime(@Param('id') id: string, @Body() body: UpdateShowtimeDto) {
    return await this.adminService.updateShowtime(id, body);
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

  /** REST aliases: same payloads as `showtime/*` (one showtime = one event in the app). */
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
}
