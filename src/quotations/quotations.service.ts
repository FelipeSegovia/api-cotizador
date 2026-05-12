import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { Quotation } from '../entities/quotation.entity';
import { QuotationItem } from '../entities/quotation-item.entity';
import type { CreateQuotationDto } from './dto/create-quotation.dto';
import type { QuotationItemInputDto } from './dto/quotation-item.dto';
import type { QuotationResponseDto } from './dto/quotation-response.dto';
import type { UpdateQuotationDto } from './dto/update-quotation.dto';

interface NormalizedItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationsRepo: Repository<Quotation>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByUser(userId: string): Promise<QuotationResponseDto[]> {
    const quotations = await this.quotationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return quotations.map((q) => this.toResponse(q));
  }

  async findOneByUser(
    userId: string,
    id: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.quotationsRepo.findOne({
      where: { id, userId },
    });
    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return this.toResponse(quotation);
  }

  async create(
    userId: string,
    dto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    const items = this.normalizeItems(dto.items);
    const total = this.calculateTotal(items);

    const quotation = this.quotationsRepo.create({
      userId,
      clientName: dto.clientName,
      clientRut: dto.clientRut ?? null,
      clientEmail: dto.clientEmail ?? null,
      projectTitle: dto.projectTitle ?? null,
      projectDeadline: dto.projectDeadline ?? null,
      projectNotes: dto.projectNotes ?? null,
      status: dto.status ?? 'draft',
      total,
      items: items.map((i) => this.toItemEntity(i)),
    });

    const saved = await this.quotationsRepo.save(quotation);
    return this.toResponse(saved);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto> {
    const existing = await this.quotationsRepo.findOne({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const items = this.normalizeItems(dto.items);
    const total = this.calculateTotal(items);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(QuotationItem, { quotationId: id });

      await manager.update(
        Quotation,
        { id },
        {
          clientName: dto.clientName,
          clientRut: dto.clientRut ?? null,
          clientEmail: dto.clientEmail ?? null,
          projectTitle: dto.projectTitle ?? null,
          projectDeadline: dto.projectDeadline ?? null,
          projectNotes: dto.projectNotes ?? null,
          status: dto.status ?? existing.status,
          total,
        },
      );

      if (items.length > 0) {
        const itemEntities = items.map((i) => ({
          quotationId: id,
          ...i,
        }));
        await manager.insert(QuotationItem, itemEntities);
      }
    });

    const refreshed = await this.quotationsRepo.findOne({
      where: { id, userId },
    });
    if (!refreshed) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return this.toResponse(refreshed);
  }

  private normalizeItems(items: QuotationItemInputDto[]): NormalizedItem[] {
    const usedIds = new Set<string>();
    return items.map((item, index) => {
      const id = item.id?.trim() || randomUUID();
      if (usedIds.has(id)) {
        throw new NotFoundException(
          `Identificador de item duplicado en la cotización: ${id}`,
        );
      }
      usedIds.add(id);
      const subtotal = Number((item.quantity * item.unitPrice).toFixed(2));
      return {
        id,
        position: index,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      };
    });
  }

  private calculateTotal(items: NormalizedItem[]): number {
    const sum = items.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(sum.toFixed(2));
  }

  private toItemEntity(item: NormalizedItem): QuotationItem {
    const entity = new QuotationItem();
    entity.id = item.id;
    entity.position = item.position;
    entity.description = item.description;
    entity.quantity = item.quantity;
    entity.unitPrice = item.unitPrice;
    entity.subtotal = item.subtotal;
    return entity;
  }

  private toResponse(quotation: Quotation): QuotationResponseDto {
    const items = [...(quotation.items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

    return {
      id: quotation.id,
      clientName: quotation.clientName,
      clientRut: quotation.clientRut,
      clientEmail: quotation.clientEmail,
      projectTitle: quotation.projectTitle,
      projectDeadline: quotation.projectDeadline,
      projectNotes: quotation.projectNotes,
      status: quotation.status,
      items,
      total: quotation.total,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
    };
  }
}
