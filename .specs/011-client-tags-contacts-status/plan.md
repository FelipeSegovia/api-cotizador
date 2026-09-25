# Plan: Tags, contactos múltiples y estados en clientes

## Archivos a tocar

- `src/entities/client.entity.ts` (editar)
- `src/migrations/1757000000000-ClientTagsAndContacts.ts` (nuevo)
- `src/clients/dto/create-client.dto.ts`, `update-client.dto.ts`, `client-response.dto.ts` (editar)
- `src/clients/dto/find-clients-query.dto.ts` (nuevo)
- `src/clients/client.mapper.ts`, `clients.service.ts`, `clients.controller.ts` (editar)
- `src/clients/clients.service.spec.ts`, `clients.controller.spec.ts` (editar)
- `docs/contrato-front.md` (editar)

## Diseño

- Columnas `tags`, `emails`, `phones` como `text[] NOT NULL DEFAULT '{}'`
- Migración: crear arrays → copiar valores → dropear `email`/`phone`
- Validación/normalización en DTOs + helper reutilizable en service
- Filtro OR con operador TypeORM/`ANY` sobre `tags`
- `ClientStatus` ampliado; `STATUS_LABELS` con Pendiente / No contesta
- `contacts` (canales booleanos) sin cambios

## Verificación end-to-end

- Unit tests Jest (service + controller)
- Swagger `/api/docs` refleja enums y arrays nuevos
