import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClientsService } from './clients.service';
import { CreateClientActivityDto } from './dto/create-client-activity.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { UpdateClientDto } from './dto/update-client.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Clientes potenciales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('business', 'common')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar clientes potenciales de la empresa',
    description:
      'Devuelve todos los clientes potenciales de la empresa del usuario autenticado.',
  })
  @ApiOkResponse({ type: [ClientResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  findAll(@Req() req: RequestWithUser): Promise<ClientResponseDto[]> {
    return this.clientsService.findAll(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear cliente potencial',
    description:
      'Crea un lead con estado not_contacted, contacts en false y actividad created.',
  })
  @ApiBody({ type: CreateClientDto })
  @ApiCreatedResponse({ type: ClientResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiUnprocessableEntityResponse({
    description: 'El usuario no tiene empresa configurada',
  })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar cliente potencial',
    description:
      'Actualiza campos parciales. Cambios de status o contacts generan actividades en el timeline.',
  })
  @ApiBody({ type: UpdateClientDto })
  @ApiOkResponse({ type: ClientResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiUnprocessableEntityResponse({
    description: 'El usuario no tiene empresa configurada',
  })
  update(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cliente potencial' })
  @ApiNoContentResponse({ description: 'Eliminado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiUnprocessableEntityResponse({
    description: 'El usuario no tiene empresa configurada',
  })
  remove(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.clientsService.remove(req.user.sub, id);
  }

  @Post(':id/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar nota al timeline',
    description:
      'Crea una actividad tipo note con createdByName del usuario autenticado.',
  })
  @ApiBody({ type: CreateClientActivityDto })
  @ApiCreatedResponse({ type: ClientResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiUnprocessableEntityResponse({
    description: 'El usuario no tiene empresa configurada',
  })
  addActivity(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateClientActivityDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.addActivity(req.user.sub, id, dto);
  }
}
