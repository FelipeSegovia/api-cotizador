# Plan: Roles, invitaciones y datos compartidos por empresa

## Archivos a tocar

- `src/entities/user.entity.ts`, `company.entity.ts`, `quotation.entity.ts` (editar)
- `src/entities/invitation.entity.ts` (nuevo)
- `src/migrations/1756000000000-CompanyRolesSharedData.ts` (nuevo)
- `src/invitations/` (módulo completo: DTOs, service, controller, mail)
- `src/auth/auth.controller.ts`, `auth.module.ts` (accept-invitation)
- `src/company/admin-companies.controller.ts` (nuevo), `company.controller.ts`, `company-terms.controller.ts`, `company.service.ts`, `company.module.ts`
- `src/users/users.controller.ts`, `users.service.ts`, DTOs, specs
- `src/quotations/quotations.service.ts`, `quotations.controller.ts`
- `src/clients/clients.controller.ts`
- `src/mail/mail.service.ts` + template de invitación
- `src/app.module.ts`, `src/config/database.config.ts`, `src/data-source.ts`

## Diseño

- Roles: `admin | business | common` + remap en migración
- `companies.userId` nullable (admin crea empresas sin dueño)
- Invitations: token en claro solo en mail; hash + expiresAt (7d) en DB; un pending por email
- Quotations: `companyId` + backfill desde `users.companyId`; queries por empresa
- Guards: company PUT solo business; users admin+business; quotes/clients business+common

## Verificación end-to-end

- Unit tests Jest (invitations, users RBAC, quotations company scope, company PUT 403)
- Swagger `/api/docs` y curl con JWT
