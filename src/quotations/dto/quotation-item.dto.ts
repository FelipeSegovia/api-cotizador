import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class QuotationItemInputDto {
  @ApiPropertyOptional({
    description:
      'Identificador del item generado por el cliente. Si se omite, el servidor genera uno.',
    example: '1777653994936-0',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  id?: string;

  @ApiProperty({ example: 'Mano de obra' })
  @IsString()
  @Length(1, 1000)
  description!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  subtotal!: number;

  @ApiProperty({ example: 2000000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class QuotationItemResponseDto {
  @ApiProperty({ example: '1777653994936-0' })
  id!: string;

  @ApiProperty({ example: 'Mano de obra' })
  description!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 2000000 })
  unitPrice!: number;

  @ApiProperty({ example: 2000000 })
  subtotal!: number;
}
