import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse } from './user.mapper';
import { USERS_ADMIN_PORT, type UsersAdminPort } from './users-admin.port';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Usuarios (Admin)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'business')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_ADMIN_PORT)
    private readonly usersAdmin: UsersAdminPort,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Admin: todos (filtro opcional companyId). Business: solo su empresa.',
  })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiOkResponse({ type: [UserResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiUnprocessableEntityResponse({
    description: 'Business sin empresa configurada',
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('companyId') companyId?: string,
  ): Promise<UserResponseDto[]> {
    const users = await this.usersAdmin.findAllForActor(
      req.user.sub,
      companyId,
    );
    return users.map(toUserResponse);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersAdmin.update(req.user.sub, id, dto);
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
    description: 'El actor intenta deshabilitarse a sí mismo',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  async toggleStatus(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersAdmin.toggleStatus(req.user.sub, id);
    return toUserResponse(user);
  }
}
