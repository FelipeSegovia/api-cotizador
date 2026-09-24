import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import type { UserRole } from '../../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nombre actualizado' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ example: '+56 9 9999 8888' })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  mobilePhone?: string;

  @ApiPropertyOptional({ enum: ['admin', 'business', 'common'] })
  @IsOptional()
  @IsEnum(['admin', 'business', 'common'] as const)
  role?: UserRole;
}
