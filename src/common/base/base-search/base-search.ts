import { SelectQueryBuilder } from 'typeorm';

interface BaseSearchParams {
  alias: string;
  qb: SelectQueryBuilder<any>;
  fields: string[];
  keyword: string;
}

export function BaseSearch({ alias, qb, fields, keyword }: BaseSearchParams) {
  const trimmed = keyword.trim();
  if (!trimmed) return;

  const conditions = fields.map((field, index) => {
    const paramKey = `keyword_${field}_${index}`;
    qb.setParameter(paramKey, `%${trimmed}%`);
    return `${alias}.${field} ILIKE :${paramKey}`;
  });

  qb.andWhere(`(${conditions.join(' OR ')})`);
}
