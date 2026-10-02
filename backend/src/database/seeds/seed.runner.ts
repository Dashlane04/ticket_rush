import { INestApplicationContext } from '@nestjs/common';
import { PermissionsSeeder } from './seeders/01-permissions-seeder';

const SEEDERS = [PermissionsSeeder];

export async function runSeeders(app: INestApplicationContext): Promise<void> {
  for (const seeder of SEEDERS) {
    console.log(`\nRunning ${seeder.name}...`);
    await app.get(seeder).run();
  }
}
