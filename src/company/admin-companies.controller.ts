import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CompanyService } from './company.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpsertCompanyDto } from './dto/upsert-company.dto';

@ApiTags('Empresas (Admin)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('companies')
export class AdminCompaniesController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas las empresas',
    description: 'Solo admin de plataforma.',
  })
  @ApiOkResponse({ type: [CompanyResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  findAll(): Promise<CompanyResponseDto[]> {
    return this.companyService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear empresa',
    description:
      'Crea una ficha de empresa sin dueño de producto. Luego se invita a un business.',
  })
  @ApiCreatedResponse({ type: CompanyResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Rol distinto de admin' })
  create(@Body() dto: UpsertCompanyDto): Promise<CompanyResponseDto> {
    return this.companyService.createAsAdmin(dto);
  }
}
