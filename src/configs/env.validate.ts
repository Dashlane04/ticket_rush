import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";


export enum NODE_ENV {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test'
}

export class EnviromentVariables {

  @IsEnum(NODE_ENV)
  NODE_ENV: NODE_ENV

  @IsNumber()
  APP_PORT: number

  @IsString()
  GLOBAL_PREFIX: string


  @IsString()
  GRPC_HOST: string


  @IsString()
  KEYCLOAK_HOST: string

  @IsString()
  KEYCLOAK_REALM: string


  @IsString()
  KEYCLOAK_CLIENT_ID: string

  @IsString()
  KEYCLOAK_CLIENT_SECRET: string

  @IsString()
  REDIS_HOST: string

  @IsNumber()
  REDIS_PORT: number

  @IsString()
  REDIS_PASSWORD: string

  @IsString()
  DB_HOST: string
}


export function validate(config: Record<string, unknown>) {
  const validationConfig = plainToInstance(EnviromentVariables, config, {
    enableImplicitConversion: true
  })

  const errors = validateSync(validationConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(
      `${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`
    )
  }

  return validationConfig;
}