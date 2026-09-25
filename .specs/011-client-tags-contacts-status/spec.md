# Spec: Tags, contactos múltiples y estados en clientes

## Objetivo

Extender el recurso `/api/clients` con tags libres filtrables, varios correos y teléfonos, y dos estados nuevos (Pendiente y No contesta).

## Requisitos funcionales

- Campo `tags: string[]` en cada cliente (lista libre, sin catálogo)
- Normalización de tags: trim, minúsculas, espacios internos a guion; patrón `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Tope: 20 tags, cada uno 1–40 caracteres; deduplicados
- `GET /api/clients?tag=...` filtra por OR (al menos un tag de la query)
- Reemplazar `email` / `phone` por `emails: string[]` y `phones: string[]`
- Migrar valores existentes al primer elemento del arreglo
- Tope: 10 emails (válidos, dedupe case-insensitive) y 10 phones (1–64 chars, dedupe tras trim)
- Estados nuevos: `pending` (Pendiente) y `no_answer` (No contesta)
- Alta sigue forzando `status=not_contacted`
- `PATCH` de `tags` / `emails` / `phones` reemplaza la lista completa; omitir no toca; `[]` vacía
- Cambios de tags/emails/phones no generan actividad en el timeline

## Fuera de alcance

- Catálogo de tags por empresa
- Relacionar clientes con cotizaciones
- Cambiar `clientEmail` único de cotizaciones
- GET individual `/api/clients/:id`

## Criterios de aceptación

- [x] `POST` acepta `tags`, `emails`, `phones` opcionales y los persiste normalizados
- [x] `PATCH` con `status=pending` o `no_answer` genera `status_changed` con labels correctos
- [x] `GET ?tag=matriculas` solo devuelve clientes de la empresa con ese tag
- [x] Respuesta ya no incluye `email` ni `phone`; incluye `emails`, `phones`, `tags`
- [x] Migración copia email/phone existentes a los arrays y elimina columnas viejas
- [x] Contrato front documentado en `docs/contrato-front.md`
