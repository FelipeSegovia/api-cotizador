import type { ClientActivity } from '../entities/client-activity.entity';
import type { Client } from '../entities/client.entity';
import type {
  ClientActivityResponseDto,
  ClientResponseDto,
} from './dto/client-response.dto';

function toActivityResponse(
  activity: ClientActivity,
): ClientActivityResponseDto {
  const response: ClientActivityResponseDto = {
    id: activity.id,
    type: activity.type,
    message: activity.message,
    createdAt: activity.createdAt,
  };
  if (activity.createdByName != null) {
    response.createdByName = activity.createdByName;
  }
  if (activity.meta != null) {
    response.meta = activity.meta;
  }
  return response;
}

export function toClientResponse(client: Client): ClientResponseDto {
  const activities = [...(client.activities ?? [])].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return {
    id: client.id,
    name: client.name,
    website: client.website,
    email: client.email,
    phone: client.phone,
    status: client.status,
    contacts: {
      email: Boolean(client.contacts?.email),
      phone: Boolean(client.contacts?.phone),
      whatsapp: Boolean(client.contacts?.whatsapp),
    },
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    activities: activities.map(toActivityResponse),
  };
}
