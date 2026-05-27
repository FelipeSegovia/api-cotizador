import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description:
      'Obligatoria si mustChangePassword es false; omitible en primer login',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ minLength: 8, example: 'NuevaClave123!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
