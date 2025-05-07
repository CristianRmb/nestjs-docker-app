import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
console.log('NODE_ENV:', process.env.NODE_ENV);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'prod';
        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          autoLoadEntities: true,
          synchronize: !isProd, // Disabilita in produzione
          ssl: isProd ? true : false,
          extra: isProd
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {},

          // entities: ['dist/**/*.entity{.ts,.js}'],
          entities: [__dirname + '/**/*.entity.js'],
          logger: 'advanced-console',
          logNotifications: true,
          logging: ['error', 'query', 'schema'],
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
