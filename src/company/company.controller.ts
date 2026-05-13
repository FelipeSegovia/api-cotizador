import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { CompanyService } from './company.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpsertCompanyDto } from './dto/upsert-company.dto';

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags('Empresa')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener datos de empresa del usuario',
    description:
      'Devuelve la ficha de empresa asociada al usuario autenticado (1-1).',
  })
  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiNotFoundResponse({ description: 'Datos de empresa no configurados' })
  findOne(@Req() req: RequestWithUser): Promise<CompanyResponseDto> {
    return this.companyService.findOneByUser(req.user.sub);
  }

  @Put()
  @ApiOperation({
    summary: 'Crear o actualizar datos de empresa',
    description:
      'Si no existe registro para el usuario, lo crea; si existe, lo actualiza.',
  })
  @ApiBody({ type: UpsertCompanyDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  upsert(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.upsert(req.user.sub, dto);
  }
}
