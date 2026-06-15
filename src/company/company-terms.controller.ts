import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { CompanyTermsService } from './company-terms.service';
import { CompanyTermsResponseDto } from './dto/company-terms-response.dto';
import { UpdateCompanyTermsDto } from './dto/update-company-terms.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Empresa')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('company/terms')
export class CompanyTermsController {
  constructor(private readonly companyTermsService: CompanyTermsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener términos y condiciones del usuario',
    description:
      'Devuelve los términos personalizados del usuario autenticado. Si nunca los guardó, responde la lista por defecto.',
  })
  @ApiOkResponse({ type: CompanyTermsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  getTerms(@Req() req: RequestWithUser): Promise<CompanyTermsResponseDto> {
    return this.companyTermsService.getForUser(req.user.sub);
  }

  @Put()
  @ApiOperation({
    summary: 'Actualizar términos y condiciones del usuario',
    description:
      'Reemplaza la lista completa de términos. Se descartan ítems vacíos tras trim; debe quedar al menos uno con contenido.',
  })
  @ApiBody({ type: UpdateCompanyTermsDto })
  @ApiOkResponse({ type: CompanyTermsResponseDto })
  @ApiBadRequestResponse({
    description: 'Body inválido o lista vacía tras sanitizar',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  updateTerms(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCompanyTermsDto,
  ): Promise<CompanyTermsResponseDto> {
    return this.companyTermsService.updateForUser(req.user.sub, dto);
  }
}
