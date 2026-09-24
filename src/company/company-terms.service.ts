import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyTerms } from '../entities/company-terms.entity';
import { DEFAULT_COMPANY_TERMS } from './default-company-terms.constants';
import { CompanyService } from './company.service';
import type { CompanyTermsResponseDto } from './dto/company-terms-response.dto';
import type { UpdateCompanyTermsDto } from './dto/update-company-terms.dto';

@Injectable()
export class CompanyTermsService {
  constructor(
    @InjectRepository(CompanyTerms)
    private readonly termsRepo: Repository<CompanyTerms>,
    private readonly companyService: CompanyService,
  ) {}

  async getForUser(userId: string): Promise<CompanyTermsResponseDto> {
    const company = await this.companyService.findByUser(userId);
    if (!company) {
      return {
        terms: [...DEFAULT_COMPANY_TERMS],
        updatedAt: new Date(),
      };
    }

    const record = await this.termsRepo.findOne({
      where: { companyId: company.id },
    });
    if (record) {
      return this.toResponse(record);
    }

    return {
      terms: [...DEFAULT_COMPANY_TERMS],
      updatedAt: company.createdAt,
    };
  }

  async resolveTermsForUser(userId: string): Promise<string[]> {
    const { terms } = await this.getForUser(userId);
    return terms;
  }

  async updateForUser(
    userId: string,
    dto: UpdateCompanyTermsDto,
  ): Promise<CompanyTermsResponseDto> {
    const company = await this.companyService.findByUser(userId);
    if (!company) {
      throw new UnprocessableEntityException(
        'Debes configurar los datos de tu empresa antes de editar los términos.',
      );
    }

    const sanitized = this.sanitizeTerms(dto.terms);
    if (sanitized.length === 0) {
      throw new BadRequestException(
        'Debe enviar al menos un término con contenido',
      );
    }

    const existing = await this.termsRepo.findOne({
      where: { companyId: company.id },
    });
    if (existing) {
      await this.termsRepo.update(
        { id: existing.id },
        { terms: sanitized, updatedAt: new Date() },
      );
      const refreshed = await this.termsRepo.findOneOrFail({
        where: { id: existing.id },
      });
      return this.toResponse(refreshed);
    }

    const created = this.termsRepo.create({
      companyId: company.id,
      terms: sanitized,
    });
    const saved = await this.termsRepo.save(created);
    return this.toResponse(saved);
  }

  /**
   * Normaliza la lista respetando el orden recibido: recorta espacios,
   * descarta vacíos y elimina duplicados conservando la primera aparición.
   */
  private sanitizeTerms(terms: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const term of terms) {
      const trimmed = term.trim();
      if (!trimmed || seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);
      result.push(trimmed);
    }
    return result;
  }

  private toResponse(record: CompanyTerms): CompanyTermsResponseDto {
    return {
      terms: [...record.terms],
      updatedAt: record.updatedAt,
    };
  }
}
