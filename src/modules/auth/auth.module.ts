import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigService } from '../../config/config.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: async (
        configService: AppConfigService,
      ): Promise<JwtModuleOptions> => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn as any,
        },
      }),
    }),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
