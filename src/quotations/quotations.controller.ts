import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Cotizaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cotizaciones del usuario autenticado',
    description:
      'Devuelve todas las cotizaciones del usuario, ordenadas por fecha de creación descendente.',
  })
  @ApiOkResponse({ type: [QuotationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  findAll(@Req() req: RequestWithUser): Promise<QuotationResponseDto[]> {
    return this.quotationsService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener cotización por id',
    description: 'Devuelve la cotización si pertenece al usuario autenticado.',
  })
  @ApiOkResponse({ type: QuotationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cotización no encontrada' })
  findOne(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.findOneByUser(req.user.sub, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear cotización',
    description:
      'Crea una cotización para el usuario autenticado. Los subtotales y el total se recalculan en el servidor.',
  })
  @ApiBody({ type: CreateQuotationDto })
  @ApiCreatedResponse({ type: QuotationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.create(req.user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar cotización por id',
    description:
      'Reemplaza la cotización completa (incluyendo items) si pertenece al usuario autenticado.',
  })
  @ApiBody({ type: UpdateQuotationDto })
  @ApiOkResponse({ type: QuotationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cotización no encontrada' })
  update(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.update(req.user.sub, id, dto);
  }
}
