import { Injectable } from "@nestjs/common";
import { AbstractSeeder } from "./abstract.seeder";
import { PermissionEntity } from "src/modules/role/entity/permission.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import permissions from '../data/permissions.json';


@Injectable()
export class PermissionsSeeder extends AbstractSeeder {

  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repo: Repository<PermissionEntity>
  ) {
    super()
  }
  async run() {
    const existPermissions = (await this.repo.find({
      where: {
        code: In(permissions.map(p => p.code))
      }
    })).map(p => p.code);

    const newPermissions = permissions.filter(p => !existPermissions.includes(p.code));

    if (newPermissions.length === 0) {
      this.log("Permissions already seeded", "skipped");
      return;
    }

    await this.repo.insert(newPermissions);

    newPermissions.forEach(p => {
      this.log(`${p.name}`, "seeded")
    })
  }
}