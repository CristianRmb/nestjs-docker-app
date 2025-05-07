import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(3000);
  // Railway espone process.env.PORT
  const port = process.env.PORT || 8080;

  console.log('process.env.PORT', process.env.PORT);

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 App is running on http://localhost:${port}`);
}
bootstrap();
