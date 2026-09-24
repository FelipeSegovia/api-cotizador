# Plan: API de clientes potenciales (empresa compartida)

## Archivos a tocar

- `src/entities/user.entity.ts`, `company-terms.entity.ts` (editar)
- `src/entities/client.entity.ts`, `client-activity.entity.ts` (nuevo)
- `src/migrations/1754000000000-SharedCompanyTenancy.ts` (nuevo)
- `src/migrations/1755000000000-CreateClients.ts` (nuevo)
- `src/company/company.service.ts`, `company-terms.service.ts`, controllers Swagger
- `src/users/users.service.ts`, `users.controller.ts`, `users-admin.port.ts`
- `src/clients/` (módulo completo)
- `src/app.module.ts`, `src/config/database.config.ts`, `src/data-source.ts`

## Diseño

- Tenancy: `users.companyId` → empresa compartida; `company_terms` keyed por `companyId`
- Clients: tablas `clients` + `client_activities`; scope por `companyId`
- Respuestas: mapper manual sin exponer `companyId`/`userId`
- Timeline automático en create/status/channel; notas vía POST activities

## Verificación end-to-end

- Unit tests Jest (service + controller + users scope)
- Swagger `/api/docs` y curl con JWT contra front en `localhost:5173`
