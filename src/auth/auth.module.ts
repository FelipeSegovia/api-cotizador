import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { jwtExpiresInSeconds } from './jwt-expires';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_SECRET?.trim() || 'development-only-set-JWT_SECRET',
      signOptions: {
        expiresIn: jwtExpiresInSeconds(),
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
