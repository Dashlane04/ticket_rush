import { registerAs } from '@nestjs/config';

/** Đọc từ biến môi trường đã được validate trong ConfigModule.forRoot (file .env). */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST as string,
  port: parseInt(process.env.REDIS_PORT as string, 10),
  password: process.env.REDIS_PASSWORD as string,
}));
