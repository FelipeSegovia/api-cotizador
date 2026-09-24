import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Token en claro recibido en el correo de invitación',
  })
  @IsString()
  @Length(1, 512)
  token!: string;

  @ApiProperty({ minLength: 8, example: 'MiClaveSegura1!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  @Length(0, 32)
  mobilePhone?: string;
}
