import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Mi Empresa SpA' })
  name!: string;

  @ApiProperty({ example: '76.123.456-7' })
  rut!: string;

  @ApiProperty({ example: 'Av. Principal 123', nullable: true })
  address!: string | null;

  @ApiProperty({ example: 'Santiago', nullable: true })
  city!: string | null;

  @ApiProperty({ example: '+56 9 1234 5678', nullable: true })
  contact!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
