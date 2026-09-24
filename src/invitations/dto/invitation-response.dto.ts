import { ApiProperty } from '@nestjs/swagger';

export class InvitationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['business', 'common'] })
  role!: 'business' | 'common';

  @ApiProperty({ format: 'uuid' })
  companyId!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  acceptedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}
