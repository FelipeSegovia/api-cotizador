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
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AcceptInvitationDto } from '../invitations/dto/accept-invitation.dto';
import { InvitationsService } from '../invitations/invitations.service';
import { AuthService } from './auth.service';
import type { JwtPayload } from './jwt-payload.type';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  AcceptInvitationSuccessDto,
  AuthUserSummaryDto,
  ForgotPasswordSuccessDto,
  LoginSuccessDto,
  LogoutSuccessDto,
  ResetPasswordSuccessDto,
  VerifyResetCodeSuccessDto,
} from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly invitationsService: InvitationsService,
  ) {}

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
  @ApiForbiddenResponse({
    description: 'Cuenta deshabilitada (isActive = false)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('accept-invitation')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Aceptar invitación y crear cuenta',
    description:
      'Endpoint público. Crea el usuario con la contraseña elegida. No emite JWT; el cliente debe hacer login después.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiOkResponse({
    description: 'Cuenta creada; el cliente debe ir a login',
    type: AcceptInvitationSuccessDto,
  })
  @ApiNotFoundResponse({ description: 'Invitación no válida o ya utilizada' })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto);
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

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cambiar contraseña del usuario autenticado',
    description:
      'En primer login (mustChangePassword) no se exige currentPassword. Tras el cambio, mustChangePassword pasa a false.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    description: 'Usuario actualizado',
    type: AuthUserSummaryDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido o contraseña actual incorrecta',
  })
  async patchPassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, dto);
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

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @ApiOperation({
    summary: 'Solicitar código de recuperación de contraseña',
    description:
      'Envía un código OTP al correo si la cuenta existe y está activa. Siempre responde con el mismo mensaje genérico.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Solicitud procesada',
    type: ForgotPasswordSuccessDto,
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verificar código OTP de recuperación',
    description:
      'Valida el código sin consumirlo. El front puede usarlo para avanzar a la pantalla de nueva contraseña.',
  })
  @ApiBody({ type: VerifyResetCodeDto })
  @ApiOkResponse({
    description: 'Código válido',
    type: VerifyResetCodeSuccessDto,
  })
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Restablecer contraseña con código OTP',
    description:
      'Valida el código nuevamente, lo consume y establece la nueva contraseña.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Contraseña actualizada',
    type: ResetPasswordSuccessDto,
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
