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
  Put,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { CompanyService } from '../company/company.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { buildQuoteNumber } from './pdf/quotation-pdf.formatters';
import { QuotationPdfService } from './pdf/quotation-pdf.service';
import { QuotationsService } from './quotations.service';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Cotizaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly companyService: CompanyService,
    private readonly quotationPdfService: QuotationPdfService,
  ) {}

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

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Descargar PDF de la cotización',
    description:
      'Genera un PDF con el mismo estilo que la vista de cotización. Requiere datos de empresa configurados (PUT /api/company).',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'Archivo PDF (descarga)' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cotización no encontrada' })
  @ApiUnprocessableEntityResponse({
    description:
      'Datos de empresa no configurados; configure con PUT /api/company',
  })
  async downloadPdf(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const company = await this.companyService.findByUserOrFail(req.user.sub);
    const quotation = await this.quotationsService.findOneByUser(
      req.user.sub,
      id,
    );
    const buffer = await this.quotationPdfService.generate(
      quotation,
      this.companyService.toResponse(company),
      req.user.sub,
    );
    const quoteNumber = buildQuoteNumber(quotation.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${quoteNumber}.pdf"`,
    });
    return new StreamableFile(buffer);
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

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar estado de la cotización (aprobada o rechazada)',
    description:
      'Solo cotizaciones en estado `sent` y vigentes pueden pasar a `approved` o `rejected`.',
  })
  @ApiBody({ type: UpdateQuotationStatusDto })
  @ApiOkResponse({ type: QuotationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Cotización no encontrada' })
  @ApiConflictResponse({
    description: 'No está en sent o ya está expirada',
  })
  @ApiUnprocessableEntityResponse({
    description: 'status distinto de approved o rejected',
  })
  updateStatus(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuotationStatusDto,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.updateStatus(req.user.sub, id, dto);
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
