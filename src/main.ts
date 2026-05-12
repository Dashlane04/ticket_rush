import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const configEarly = app.get(ConfigService);
  const rawOrigins = configEarly.get<string>('FRONTEND_ORIGIN');
  const parsed =
    rawOrigins
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const origins = parsed.length > 0 ? parsed : ['http://localhost:3001'];
  app.enableCors({ origin: origins, credentials: true });

  setupSwagger(app);

  const config = app.get(ConfigService);
  const base = Number(config.getOrThrow('APP_PORT'));
  const maxTries = 10;
  for (let i = 0; i < maxTries; i++) {
    const port = base + i;
    try {
      await app.listen(port);
      Logger.log(`HTTP ${port}  (đăng ký: /signup.html, swagger: /api/docs)`);
      return;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as NodeJS.ErrnoException).code
          : undefined;
      if (code !== 'EADDRINUSE' || i === maxTries - 1) {
        throw err;
      }
      Logger.warn(`Cổng ${port} đang bận, thử ${port + 1}…`);
    }
  }
}
bootstrap();
