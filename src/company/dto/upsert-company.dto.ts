import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpsertCompanyDto {
  @ApiProperty({ example: 'Mi Empresa SpA' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ example: '76.123.456-7' })
  @IsString()
  @Length(1, 32)
  rut!: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;

  @ApiPropertyOptional({ example: 'Santiago' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  city?: string;

  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  contact?: string;
}
