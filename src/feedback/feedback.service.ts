import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import type { CreateFeedbackDto } from './dto/create-feedback.dto';
import type { FeedbackResponseDto } from './dto/feedback-response.dto';
import type { FeedbackCategory } from './enums/feedback-category.enum';
import type { FeedbackPriority } from './enums/feedback-priority.enum';
import type { FeedbackStatus } from './enums/feedback-status.enum';
import { toFeedbackResponse } from './feedback.mapper';

export interface FindAllFeedbackFilters {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async create(
    userId: string,
    userEmail: string,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const entity = this.feedbackRepo.create({
      userId,
      userEmail,
      title: dto.title,
      category: dto.category,
      description: dto.description,
      status: 'pending',
      priority: 'medium',
    });
    const saved = await this.feedbackRepo.save(entity);
    this.logger.log(`Feedback creado id=${saved.id} userId=${userId}`);
    return toFeedbackResponse(saved);
  }

  async findByUser(userId: string): Promise<FeedbackResponseDto[]> {
    const items = await this.feedbackRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map(toFeedbackResponse);
  }

  async findAll(
    filters: FindAllFeedbackFilters,
  ): Promise<FeedbackResponseDto[]> {
    const where: FindOptionsWhere<Feedback> = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    const items = await this.feedbackRepo.find({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return items.map(toFeedbackResponse);
  }

  async findOne(id: string): Promise<FeedbackResponseDto> {
    const entity = await this.feedbackRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!entity) {
      throw new NotFoundException('Feedback no encontrado');
    }
    return toFeedbackResponse(entity);
  }

  async updatePriority(
    id: string,
    priority: FeedbackPriority,
  ): Promise<FeedbackResponseDto> {
    const entity = await this.feedbackRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!entity) {
      throw new NotFoundException('Feedback no encontrado');
    }
    entity.priority = priority;
    const saved = await this.feedbackRepo.save(entity);
    this.logger.log(`Feedback id=${id} priority=${priority}`);
    return toFeedbackResponse(saved);
  }
}
