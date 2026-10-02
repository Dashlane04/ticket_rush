import { Injectable } from '@nestjs/common';
import { AbstractSeeder } from './abstract.seeder';
import { PermissionEntity } from 'src/modules/role/entity/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import permissions from '../data/permissions.json';

@Injectable()
export class PermissionsSeeder extends AbstractSeeder {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repo: Repository<PermissionEntity>,
  ) {
    super();
  }
  async run() {
    const existPermissions = (
      await this.repo.find({
        where: {
          name: In(permissions.map((p) => p.name)),
        },
      })
    ).map((p) => p.name);

    const newPermissions = permissions.filter(
      (p) => !existPermissions.includes(p.name),
    );

    if (newPermissions.length === 0) {
      this.log('Permissions already seeded', 'skipped');
      return;
    }

    await this.repo.insert(
      newPermissions.map((p) => ({
        name: p.name,
        description: p.code,
      })),
    );

    newPermissions.forEach((p) => {
      this.log(`${p.name}`, 'seeded');
    });
  }
}
