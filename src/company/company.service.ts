import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import type { CompanyResponseDto } from './dto/company-response.dto';
import type { UpsertCompanyDto } from './dto/upsert-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async findByUser(userId: string): Promise<Company | null> {
    return this.companyRepo.findOne({ where: { userId } });
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
  ): Promise<CompanyResponseDto> {
    const existing = await this.findByUser(userId);
    const address = dto.address?.trim() || null;
    const city = dto.city?.trim() || null;
    const contact = dto.contact?.trim() || null;

    if (existing) {
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
      const refreshed = await this.companyRepo.findOneOrFail({
        where: { id: existing.id },
      });
      return this.toResponse(refreshed);
    }

    const created = this.companyRepo.create({
      userId,
      name: dto.name.trim(),
      rut: dto.rut.trim(),
      address,
      city,
      contact,
    });
    const saved = await this.companyRepo.save(created);
    return this.toResponse(saved);
  }

  toResponse(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      rut: company.rut,
      address: company.address,
      city: company.city,
      contact: company.contact,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
