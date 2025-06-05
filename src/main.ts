import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Puoi specificare l'URL del frontend se lo desideri
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Aggiungi i metodi che ti servono
  });

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  // await app.listen(3000);
  // Railway espone process.env.PORT
  const port = process.env.PORT || 8080;

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 App is running on http://localhost:${port}`);
}
bootstrap();
