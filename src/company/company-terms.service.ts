import {
  BadRequestException,
  Injectable,
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
    const record = await this.termsRepo.findOne({ where: { userId } });
    if (record) {
      return this.toResponse(record);
    }

    return {
      terms: [...DEFAULT_COMPANY_TERMS],
      updatedAt: await this.resolveDefaultUpdatedAt(userId),
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
    const sanitized = this.sanitizeTerms(dto.terms);
    if (sanitized.length === 0) {
      throw new BadRequestException(
        'Debe enviar al menos un término con contenido',
      );
    }

    const existing = await this.termsRepo.findOne({ where: { userId } });
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
      userId,
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

  private async resolveDefaultUpdatedAt(userId: string): Promise<Date> {
    const company = await this.companyService.findByUser(userId);
    return company?.createdAt ?? new Date();
  }

  private toResponse(record: CompanyTerms): CompanyTermsResponseDto {
    return {
      terms: [...record.terms],
      updatedAt: record.updatedAt,
    };
  }
}
