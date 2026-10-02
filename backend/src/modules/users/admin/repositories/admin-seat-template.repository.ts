import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { SeatTemplate } from 'src/modules/tickets/entities/template-seat.entity';

export type TemplateSummaryRow = {
  templateId: string;
  templateName: string;
  hallName: string;
};

/**
 * Blueprint ghế (template_seats) — dùng cho admin publish/list/delete.
 */
@Injectable()
export class AdminSeatTemplateRepository {
  constructor(
    @InjectRepository(SeatTemplate)
    private readonly repo: Repository<SeatTemplate>,
  ) {}

  async findDistinctSummaries(): Promise<TemplateSummaryRow[]> {
    const rows = await this.repo
      .createQueryBuilder('st')
      .select(['st.templateId', 'st.templateName', 'st.hallName'])
      .distinct(true)
      .getRawMany();

    return rows.map((row) => ({
      templateId: row.st_templateId,
      templateName: row.st_templateName,
      hallName: row.st_hallName,
    }));
  }

  findByTemplateId(templateId: string): Promise<SeatTemplate[]> {
    return this.repo.find({ where: { templateId } });
  }

  deleteByTemplateId(templateId: string) {
    return this.repo.delete({ templateId });
  }

  insertMany(
    manager: EntityManager,
    rows: Array<
      Pick<
        SeatTemplate,
        | 'templateId'
        | 'templateName'
        | 'hallName'
        | 'seatId'
        | 'rowNumber'
        | 'colNumber'
        | 'type'
        | 'isBlocked'
      >
    >,
  ) {
    return manager.insert(SeatTemplate, rows);
  }
}
