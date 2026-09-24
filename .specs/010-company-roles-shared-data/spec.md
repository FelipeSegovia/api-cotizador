# Spec: Roles, invitaciones y datos compartidos por empresa

## Objetivo

Introducir tres roles de plataforma (`admin`, `business`, `common`), alta de usuarios por invitación (self-signup) y cotizaciones compartidas entre usuarios de la misma empresa.

## Requisitos funcionales

- Roles: `admin` (plataforma), `business` (dueño operativo de empresa), `common` (operador)
- Admin crea empresas (`GET/POST /api/companies`) e invita `business` o `common` a cualquier empresa
- Business edita ficha y términos de su empresa; invita solo `common` de su empresa; opera cotizaciones y clientes
- Common opera cotizaciones y clientes; solo lectura de ficha/términos
- Alta por invitación: token hasheado, link `{DOMAIN_URL}/invitar?token=...`, aceptación con password en `POST /api/auth/accept-invitation`
- Cotizaciones aisladas por `companyId` (compartidas en la empresa); `userId` queda como autor
- Clientes siguen por `companyId` (sin cambio de tenancy); guards de rol en clients y quotations
- Migración: admins con `companyId` → `business`; admins sin empresa permanecen `admin`
- Se elimina `POST /api/users` con password provisional

## Fuera de alcance

- UI del front (`cotizador-app`)
- Feedback a tenancy por empresa
- Relacionar clientes con cotizaciones (FK)
- Mover usuarios entre empresas
- Admin operando cotizaciones/clientes

## Criterios de aceptación

- [x] `UserRole` = `admin | business | common`; remap de admins de empresa → `business`
- [x] Admin: `GET/POST /api/companies`; invita con `companyId` + `role` obligatorios
- [x] Business: `PUT /api/company` y terms OK; invita solo `common` de su empresa
- [x] Common: `PUT /api/company` → `403`; `POST /api/invitations` → `403`
- [x] `POST /api/auth/accept-invitation` crea usuario activo, marca invitación aceptada; login posterior
- [x] Cotizaciones listadas/editadas por `companyId`; sin empresa `[]`/`422`; cross-company `404`
- [x] Clients y quotations: solo `business` y `common` (admin `403`)
- [x] `GET/PATCH /api/users` disponibles para `admin` y `business` (scopes distintos)
