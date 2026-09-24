import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
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
import { CompanyTermsService } from './company-terms.service';
import { CompanyTermsResponseDto } from './dto/company-terms-response.dto';
import { UpdateCompanyTermsDto } from './dto/update-company-terms.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Empresa')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/terms')
export class CompanyTermsController {
  constructor(private readonly companyTermsService: CompanyTermsService) {}

  @Get()
  @Roles('admin', 'business', 'common')
  @ApiOperation({
    summary: 'Obtener términos y condiciones de la empresa',
    description:
      'Devuelve los términos personalizados de la empresa del usuario autenticado. Si nunca se guardaron, responde la lista por defecto.',
  })
  @ApiOkResponse({ type: CompanyTermsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  getTerms(@Req() req: RequestWithUser): Promise<CompanyTermsResponseDto> {
    return this.companyTermsService.getForUser(req.user.sub);
  }

  @Put()
  @Roles('business')
  @ApiOperation({
    summary: 'Actualizar términos y condiciones de la empresa',
    description:
      'Solo business. Reemplaza la lista completa de términos. Se descartan ítems vacíos tras trim; debe quedar al menos uno con contenido. Requiere empresa configurada.',
  })
  @ApiBody({ type: UpdateCompanyTermsDto })
  @ApiOkResponse({ type: CompanyTermsResponseDto })
  @ApiBadRequestResponse({
    description: 'Body inválido o lista vacía tras sanitizar',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de business' })
  updateTerms(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCompanyTermsDto,
  ): Promise<CompanyTermsResponseDto> {
    return this.companyTermsService.updateForUser(req.user.sub, dto);
  }
}
