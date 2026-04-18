import { NestFactory } from "@nestjs/core";
import { SeedModule } from "./seed.module";
import { runSeeders } from "./seed.runner";


async function bootstrap() {

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn']
  })

  try {
    console.log('Starting database seeding...');
    await runSeeders(app);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
  finally {
    await app.close()
  }
}
bootstrap();