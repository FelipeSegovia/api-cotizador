import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { UsersService } from '../users/users.service';
import { convertToWebp } from '../storage/image.util';
import { StorageService } from '../storage/storage.service';
import type { CompanyLogoUploadFile } from './company-logo-file';
import type { CompanyResponseDto } from './dto/company-response.dto';
import type { UpsertCompanyDto } from './dto/upsert-company.dto';

export interface UpsertCompanyOptions {
  logoFile?: CompanyLogoUploadFile;
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly storage: StorageService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.companyRepo.find({
      order: { createdAt: 'DESC' },
    });
    return companies.map((c) => this.toResponse(c));
  }

  async createAsAdmin(dto: UpsertCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.companyRepo.save(
      this.companyRepo.create({
        userId: null,
        name: dto.name.trim(),
        rut: dto.rut.trim(),
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        contact: dto.contact?.trim() || null,
      }),
    );
    return this.toResponse(company);
  }

  async findByUser(userId: string): Promise<Company | null> {
    const user = await this.usersService.findById(userId);
    if (!user?.companyId) {
      return null;
    }
    return this.companyRepo.findOne({ where: { id: user.companyId } });
  }

  async findByUserOrFail(userId: string): Promise<Company> {
    const company = await this.findByUser(userId);
    if (!company) {
      throw new UnprocessableEntityException(
        'Debes configurar los datos de tu empresa antes de generar PDFs.',
      );
    }
    return company;
  }

  async findOneByUser(userId: string): Promise<CompanyResponseDto> {
    const company = await this.findByUser(userId);
    if (!company) {
      throw new NotFoundException('Datos de empresa no configurados');
    }
    return this.toResponse(company);
  }

  async upsert(
    userId: string,
    dto: UpsertCompanyDto,
    options: UpsertCompanyOptions = {},
  ): Promise<CompanyResponseDto> {
    const address = dto.address?.trim() || null;
    const city = dto.city?.trim() || null;
    const contact = dto.contact?.trim() || null;
    const { logoFile } = options;

    const existing = await this.findByUser(userId);
    if (!existing) {
      throw new UnprocessableEntityException(
        'La empresa debe ser creada por el administrador de plataforma.',
      );
    }

    await this.companyRepo.update(
      { id: existing.id },
      {
        name: dto.name.trim(),
        rut: dto.rut.trim(),
        address,
        city,
        contact,
      },
    );
    let company = await this.companyRepo.findOneOrFail({
      where: { id: existing.id },
    });

    if (logoFile) {
      company = await this.applyLogo(company, logoFile);
    }

    return this.toResponse(company);
  }

  private async applyLogo(
    company: Company,
    file: CompanyLogoUploadFile,
  ): Promise<Company> {
    const previousKey = company.logoKey;

    let webp: Buffer;
    try {
      webp = await convertToWebp(file.buffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.logger.warn({
        msg: 'No se pudo procesar la imagen del logo',
        companyId: company.id,
        err: { message },
      });
      throw new UnprocessableEntityException(
        'La imagen no es válida o no se pudo convertir a WebP.',
      );
    }

    const key = `companies/${company.id}/logo-${randomUUID()}.webp`;

    try {
      await this.storage.uploadPublicObject(key, webp, 'image/webp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.logger.error({
        msg: 'Fallo al subir logo a Spaces',
        companyId: company.id,
        key,
        err: { message },
      });
      throw new InternalServerErrorException(
        'No se pudo guardar el logo. Intenta de nuevo.',
      );
    }

    const logoUrl = this.storage.buildPublicUrl(key);
    await this.companyRepo.update(
      { id: company.id },
      { logoUrl, logoKey: key },
    );

    if (previousKey && previousKey !== key) {
      await this.deleteLogoObjectBestEffort(previousKey, company.id);
    }

    return this.companyRepo.findOneOrFail({ where: { id: company.id } });
  }

  private async deleteLogoObjectBestEffort(
    key: string,
    companyId: string,
  ): Promise<void> {
    try {
      await this.storage.deleteObject(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.logger.warn({
        msg: 'No se pudo eliminar logo anterior en Spaces',
        companyId,
        key,
        err: { message },
      });
    }
  }

  toResponse(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      rut: company.rut,
      address: company.address,
      city: company.city,
      contact: company.contact,
      logoUrl: company.logoUrl,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
