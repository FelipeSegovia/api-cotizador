import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateCompanyTermsDto {
  @ApiProperty({
    type: [String],
    example: [
      'Forma de pago: 50% al aceptar cotización, 50% al término de implementación.',
      'Los precios están expresados en Pesos Chilenos (CLP).',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  terms!: string[];
}
