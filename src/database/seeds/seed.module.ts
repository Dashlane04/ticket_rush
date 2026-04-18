
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from 'src/modules/role/entity/permission.entity';
import { PermissionsSeeder } from './seeders/01-permissions-seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    })
    ,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return (
          {
            type: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            entities: [PermissionEntity],
            synchronize: false,
            autoLoadEntities: false,
          }
        )
      }
    }),
    TypeOrmModule.forFeature([
      PermissionEntity
    ])
  ],
  providers: [
    PermissionsSeeder
  ]
})
export class SeedModule { }
