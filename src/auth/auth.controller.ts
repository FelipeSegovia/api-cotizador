import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { JwtPayload } from './jwt-payload.type';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  AuthUserSummaryDto,
  LoginSuccessDto,
  LogoutSuccessDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicio de sesión',
    description: 'Devuelve un JWT válido junto al resumen del usuario.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Credenciales válidas',
    type: LoginSuccessDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Perfil del usuario autenticado',
    description: 'Requiere el encabezado Authorization: Bearer <token>.',
  })
  @ApiOkResponse({ description: 'Usuario actual', type: AuthUserSummaryDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  async me(@Req() req: RequestWithUser) {
    return this.authService.me(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Actualizar perfil del usuario autenticado',
    description:
      'Actualmente permite establecer `mobilePhone`. Requiere Authorization: Bearer.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({
    description: 'Usuario actualizado',
    type: AuthUserSummaryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  async patchMe(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.authService.patchMe(req.user.sub, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cierre de sesión',
    description:
      'En este BFF es informativo; invalidar JWT es responsabilidad del cliente.',
  })
  @ApiOkResponse({ description: 'Confirmación', type: LogoutSuccessDto })
  logout() {
    return this.authService.logout();
  }
}
