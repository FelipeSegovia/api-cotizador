import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from '../enums/feedback-category.enum';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'Exportar cotizaciones a Excel', minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiProperty({ enum: FEEDBACK_CATEGORIES, example: 'feature' })
  @IsIn([...FEEDBACK_CATEGORIES], { message: 'Categoría inválida' })
  category!: FeedbackCategory;

  @ApiProperty({
    example:
      'Sería útil poder exportar el listado de cotizaciones a Excel para reportes internos.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;
}
