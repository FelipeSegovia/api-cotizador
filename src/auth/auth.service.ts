import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import { jwtExpiresInSeconds } from './jwt-expires';
import type { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    const token = await this.jwtService.signAsync(payload);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      expiresIn: jwtExpiresInSeconds(),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  logout() {
    return { message: 'Logout exitoso' };
  }
}
