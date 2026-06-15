import { ApiProperty } from '@nestjs/swagger';

export class CompanyTermsResponseDto {
  @ApiProperty({
    type: [String],
    example: [
      'Forma de pago: 50% al aceptar cotización, 50% al término de implementación.',
      'Los precios están expresados en Pesos Chilenos (CLP).',
    ],
  })
  terms!: string[];

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
