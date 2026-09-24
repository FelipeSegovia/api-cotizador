# Spec: API de clientes potenciales (empresa compartida)

## Objetivo

Exponer el recurso `/api/clients` con el contrato del frontend de Clientes y compartir leads entre usuarios de la misma empresa.

## Requisitos funcionales

- CRUD de clientes potenciales: `GET/POST /api/clients`, `PATCH/DELETE /api/clients/:id`
- Notas de timeline: `POST /api/clients/:id/activities`
- Clientes aislados por `companyId` (empresa compartida vía `users.companyId`)
- Actividades automáticas al crear, cambiar estado o toggle de canal
- Shape de respuesta idéntico al documentado por el front (`Client` / `ClientActivity`)
- JWT obligatorio en todas las rutas
- Admin de usuarios: listar/crear/editar solo dentro de la misma empresa; al crear se asigna `companyId` del admin

## Fuera de alcance

- Relacionar clientes con cotizaciones
- GET individual `/api/clients/:id`
- Validar formato de `website`
- Migrar cotizaciones/feedback a tenancy por empresa
- Roles distintos para editar empresa vs clientes

## Criterios de aceptación

- [ ] `GET /api/clients` devuelve solo clientes de la empresa del usuario (o `[]` si no tiene empresa)
- [ ] `POST /api/clients` crea con `status=not_contacted`, contacts en false y actividad `created`
- [ ] `PATCH` de status/canales genera actividades; campos de contacto sin actividad
- [ ] `POST .../activities` crea nota con `createdByName` del usuario
- [ ] `DELETE` responde `204`
- [ ] Cross-company → `404`; mutaciones sin empresa → `422`
- [ ] GET/PUT company y términos se resuelven por `user.companyId`
- [ ] Admin sin empresa no puede crear usuarios (`422`)
