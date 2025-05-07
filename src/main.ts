import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(3000);
  // Railway espone process.env.PORT
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 App is running on http://localhost:${port}`);
}
bootstrap();
