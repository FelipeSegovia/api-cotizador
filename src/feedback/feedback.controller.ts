import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackResponseDto } from './dto/feedback-response.dto';
import { FindAllFeedbackQueryDto } from './dto/find-all-feedback-query.dto';
import { UpdateFeedbackPriorityDto } from './dto/update-feedback-priority.dto';
import { FeedbackValidationPipe } from './feedback-validation.pipe';
import { FeedbackService } from './feedback.service';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Feedback')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar sugerencia u opinión',
    description:
      'Crea un feedback asociado al usuario autenticado. El estado inicial es `pending`.',
  })
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  create(
    @Req() req: RequestWithUser,
    @Body(FeedbackValidationPipe) dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.create(req.user.sub, req.user.email, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar mis sugerencias',
    description:
      'Devuelve el feedback del usuario autenticado, ordenado por fecha de creación descendente.',
  })
  @ApiOkResponse({ type: [FeedbackResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  findMine(@Req() req: RequestWithUser): Promise<FeedbackResponseDto[]> {
    return this.feedbackService.findByUser(req.user.sub);
  }

  @Get('all')
  @Roles('admin')
  @ApiOperation({
    summary: 'Listar todo el feedback (admin)',
    description:
      'Listado global para el panel de administración. Filtros opcionales por `status`, `category` y `priority`.',
  })
  @ApiOkResponse({ type: [FeedbackResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  findAll(
    @Query(FeedbackValidationPipe) query: FindAllFeedbackQueryDto,
  ): Promise<FeedbackResponseDto[]> {
    return this.feedbackService.findAll({
      status: query.status,
      category: query.category,
      priority: query.priority,
    });
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Obtener detalle de feedback (admin)',
    description: 'Devuelve un feedback por ID para el modal de detalle del panel.',
  })
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id/priority')
  @Roles('admin')
  @ApiOperation({
    summary: 'Actualizar prioridad del feedback (admin)',
    description: 'Cambia la prioridad: high, medium o low.',
  })
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  @ApiNotFoundResponse({ description: 'Feedback no encontrado' })
  updatePriority(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(FeedbackValidationPipe) dto: UpdateFeedbackPriorityDto,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.updatePriority(id, dto.priority);
  }
}
