import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NODE_ENV {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

/** Chuẩn hóa giá trị từ file .env / process.env (trim chuỗi). Không thêm default trong code — thiếu biến sẽ fail validate. */
function trimEnv(config: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).map(([k, v]) => [
      k,
      typeof v === 'string' ? v.trim() : v,
    ]),
  );
}

export class EnviromentVariables {
  @IsEnum(NODE_ENV)
  NODE_ENV: NODE_ENV;

  @IsNumber()
  APP_PORT: number;

  @IsString()
  GLOBAL_PREFIX: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  @MinLength(1)
  REDIS_PASSWORD: string;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  @MinLength(1)
  DB_USER: string;

  @IsString()
  @MinLength(1)
  DB_PASSWORD: string;

  @IsString()
  @MinLength(1)
  DB_NAME: string;

  @IsString()
  @MinLength(1)
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumber()
  JWT_REFRESH_TTL_SEC?: number;

  /** CORS: CSV origins, e.g. http://localhost:3001 — mặc định backend dùng localhost:3001 nếu bỏ trống */
  @IsOptional()
  @IsString()
  FRONTEND_ORIGIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const trimmed = trimEnv(config);

  const validationConfig = plainToInstance(EnviromentVariables, trimmed, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validationConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }

  return validationConfig;
}
