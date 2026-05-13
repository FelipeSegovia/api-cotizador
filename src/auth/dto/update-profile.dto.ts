import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Teléfono de contacto; cadena vacía borra el valor',
    example: '+56912345678',
  })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  mobilePhone?: string;
}
