# Tasks

1. [x] Migración: roles, companies.userId nullable, invitations, quotations.companyId + backfill
2. [x] Entidades y registro TypeORM (Invitation, UserRole, Company, Quotation)
3. [x] Módulo invitations + mail + POST /auth/accept-invitation; retirar POST /users con password
4. [x] RBAC: guards company/users/quotes/clients + GET/POST /companies (admin)
5. [x] Cotizaciones filtradas por companyId
6. [x] Tests unitarios (invitations, RBAC, quotations tenancy)
