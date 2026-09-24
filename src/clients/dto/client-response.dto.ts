import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ClientActivityType } from '../../entities/client-activity.entity';
import type {
  ClientContacts,
  ClientStatus,
} from '../../entities/client.entity';
import { CLIENT_STATUSES } from './update-client.dto';

export class ClientActivityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['created', 'status_changed', 'channel_toggled', 'note'],
  })
  type!: ClientActivityType;

  @ApiProperty()
  message!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  createdByName?: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  meta?: Record<string, unknown> | null;
}

export class ClientContactsResponseDto {
  @ApiProperty()
  email!: boolean;

  @ApiProperty()
  phone!: boolean;

  @ApiProperty()
  whatsapp!: boolean;
}

export class ClientResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Ana Torres' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://anatorres.com', nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ example: 'ana@anatorres.com', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ example: '+34 600 123 456', nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: CLIENT_STATUSES })
  status!: ClientStatus;

  @ApiProperty({ type: ClientContactsResponseDto })
  contacts!: ClientContacts;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: [ClientActivityResponseDto] })
  activities!: ClientActivityResponseDto[];
}
