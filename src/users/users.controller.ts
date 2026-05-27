import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  USER_CREDENTIALS_MAIL_PORT,
  type UserCredentialsMailPort,
} from '../mail/user-credentials-mail.port';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse } from './user.mapper';
import { USERS_ADMIN_PORT, type UsersAdminPort } from './users-admin.port';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Usuarios (Admin)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_ADMIN_PORT)
    private readonly usersAdmin: UsersAdminPort,
    @Inject(USER_CREDENTIALS_MAIL_PORT)
    private readonly credentialsMail: UserCredentialsMailPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (admin)' })
  @ApiOkResponse({ type: [UserResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersAdmin.findAll();
    return users.map(toUserResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Crea el usuario con contraseña provisional y envía credenciales por correo.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersAdmin.createAdminUser(dto);
    await this.credentialsMail.sendUserCredentialsMail({
      to: dto.email,
      name: dto.name,
      email: dto.email,
      temporaryPassword: dto.password,
      isResend: false,
    });
    return toUserResponse(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersAdmin.update(id, dto);
    return toUserResponse(user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Habilitar o deshabilitar usuario',
    description: 'Alterna el campo isActive del usuario.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({
    description: 'El admin intenta deshabilitarse a sí mismo',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  async toggleStatus(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersAdmin.toggleStatus(req.user.sub, id);
    return toUserResponse(user);
  }

  @Post(':id/resend-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar contraseña provisional',
    description:
      'Genera una nueva contraseña provisional, la persiste y la envía por correo.',
  })
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
        user: { $ref: '#/components/schemas/UserResponseDto' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  async resendPassword(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string; user: UserResponseDto }> {
    const { user, plainPassword } =
      await this.usersAdmin.resendProvisionalPassword(id);
    await this.credentialsMail.sendUserCredentialsMail({
      to: user.email,
      name: user.name,
      email: user.email,
      temporaryPassword: plainPassword,
      isResend: true,
    });
    return {
      message: 'Contraseña provisional reenviada por correo',
      user: toUserResponse(user),
    };
  }
}
