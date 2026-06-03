import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.type';
import { toCompanyLogoUploadFile } from './company-logo-file';
import { CompanyService } from './company.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpsertCompanyDto } from './dto/upsert-company.dto';

type RequestWithUser = Request & { user: JwtPayload };

const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_MIME_REGEX = /^image\/(png|jpeg|gif|webp)$/;

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
      'Acepta multipart/form-data con los campos de empresa y, opcionalmente, logo (PNG/JPG/GIF/WebP, máx. 5 MB). ' +
      'También acepta application/json sin archivo.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'rut'],
      properties: {
        name: { type: 'string', example: 'Mi Empresa SpA' },
        rut: { type: 'string', example: '76.123.456-7' },
        address: { type: 'string', example: 'Av. Principal 123' },
        city: { type: 'string', example: 'Santiago' },
        contact: { type: 'string', example: '+56 9 1234 5678' },
        logo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiUnprocessableEntityResponse({
    description: 'Datos inválidos o imagen de logo no procesable',
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: LOGO_MAX_BYTES },
    }),
  )
  upsert(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertCompanyDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: LOGO_MAX_BYTES }),
          new FileTypeValidator({
            fileType: LOGO_MIME_REGEX,
          }),
        ],
      }),
    )
    logo?: Express.Multer.File,
  ): Promise<CompanyResponseDto> {
    return this.companyService.upsert(req.user.sub, dto, {
      logoFile: logo ? toCompanyLogoUploadFile(logo) : undefined,
    });
  }
}
