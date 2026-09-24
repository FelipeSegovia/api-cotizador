import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { InvitationsService } from './invitations.service';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Invitaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'business')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invitar usuario',
    description:
      'Admin: companyId y role (business|common) obligatorios. Business: invita solo common a su empresa.',
  })
  @ApiCreatedResponse({ type: InvitationResponseDto })
  @ApiConflictResponse({ description: 'Email o invitación pendiente duplicada' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiUnprocessableEntityResponse({
    description: 'Faltan companyId/role o el actor no tiene empresa',
  })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar invitaciones pendientes' })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Filtro opcional (solo admin)',
  })
  @ApiOkResponse({ type: [InvitationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('companyId') companyId?: string,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationsService.findPending(req.user.sub, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar invitación pendiente' })
  @ApiNoContentResponse({ description: 'Revocada' })
  @ApiNotFoundResponse({ description: 'Invitación no encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  revoke(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.invitationsService.revoke(req.user.sub, id);
  }
}
