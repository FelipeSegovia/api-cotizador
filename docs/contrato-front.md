# Contrato de API para el front

Documento para generar la UI de `cotizador-app` a partir de lo que realmente entrega esta API.

- Spec machine-readable (tipos, required, enums, ejemplos): `GET /api/openapi.json`
- UI exploratoria: `GET /api/docs`
- YAML: `GET /api/openapi.yaml`

Base URL local: `http://localhost:3000`. Prefijo de todas las rutas: `/api`.

---

## 1. Convenciones

| Tema | Contrato |
|------|----------|
| Auth | Header `Authorization: Bearer <token>` en todo endpoint marcado como autenticado |
| Token | Sale de `POST /api/auth/login` → `token`. Guardar en memoria o storage del cliente. El logout **no** invalida el JWT en servidor |
| Expiración | `expiresIn` en **segundos** (ej. `900`). Re-login al vencer |
| Content-Type | `application/json`, salvo `PUT /api/company` que también acepta `multipart/form-data` |
| IDs | UUID v4 |
| Dinero | Números en CLP (pesos chilenos, sin símbolo). `unitPrice` hasta 2 decimales |
| Fechas de negocio | `YYYY-MM-DD` (`validUntil`, `projectDeadline` puede ser string libre) |
| Timestamps | ISO-8601 (`createdAt`, `updatedAt`, `expiresAt`) |
| Textos de UI | Español |
| Roles en JWT | `admin` \| `business` \| `common`. El usuario **no** incluye `companyId` en las respuestas actuales: la ficha se infiere con `GET /api/company` |

### Sobre de error

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "traceId": "opcional"
}
```

`message` puede ser `string` o `string[]` (validación `class-validator`). Códigos frecuentes:

| HTTP | Uso en UI |
|------|-----------|
| 400 | Body inválido (términos vacíos, invitación expirada, código OTP mal formado) |
| 401 | Sin token, token inválido o credenciales incorrectas → redirigir a login |
| 403 | Rol insuficiente o cuenta `isActive: false` |
| 404 | Recurso inexistente o de otra empresa (no filtrar IDs de otras empresas: tratar como “no encontrado”) |
| 409 | Conflicto de negocio (email duplicado, cotización no se puede enviar/cambiar estado) |
| 422 | Empresa no configurada, datos incompletos, validación de dominio |

---

## 2. Roles y mapa de pantallas

Tras `login` / `GET /api/auth/me` leer `user.role` y `user.mustChangePassword`.

| Rol | Quién es | Navegación sugerida |
|-----|----------|---------------------|
| `admin` | Admin de plataforma (sin operar cotizaciones ni clientes) | Empresas, invitaciones, usuarios (todas las empresas), feedback global |
| `business` | Dueño operativo de una empresa | Cotizaciones, clientes, ficha empresa (edición), términos (edición), usuarios de su empresa, invitaciones `common`, perfil, feedback propio |
| `common` | Operador de la empresa | Cotizaciones, clientes, ficha empresa (**solo lectura**), términos (**solo lectura**), perfil, feedback propio |

Si `mustChangePassword === true` → pantalla obligatoria de cambio de clave **antes** del resto de la app. En ese flujo `currentPassword` es opcional.

`GET /api/company`:

- `200` → empresa lista (mostrar logo, RUT, etc.)
- `404` → ficha no configurada. Solo `business` puede completarla con `PUT /api/company`. `common` debe ver un aviso de “pide al dueño que configure la empresa”. `admin` no opera esta ficha (usa `/api/companies`).

---

## 3. Flujos de pantallas

### 3.1 Login

1. Formulario: `email`, `password`
2. `POST /api/auth/login`
3. Guardar `token` y `user`
4. Si `403` → cuenta deshabilitada (mensaje del servidor)
5. Si `mustChangePassword` → pantalla “definir contraseña”
6. Según `role`, entrar al dashboard correspondiente

### 3.2 Recuperar contraseña

1. `POST /api/auth/forgot-password` `{ email }` — **siempre** el mismo mensaje genérico (no revelar si el correo existe)
2. Pantalla OTP: 6 dígitos + email
3. `POST /api/auth/verify-reset-code` — si `valid: true`, avanzar
4. `POST /api/auth/reset-password` `{ email, code, newPassword }` → volver a login

Rate limits: forgot 3/15 min; verify y reset 5/min.

### 3.3 Aceptar invitación

El correo apunta a `{DOMAIN_URL}/invitar?token=...`.

1. Formulario público: `password` (mín. 8), `mobilePhone` opcional. El `token` sale de la query
2. `POST /api/auth/accept-invitation`
3. Toast con `message` y redirigir a login (este endpoint **no** emite JWT)

### 3.4 Primer login / cambio de clave

`PATCH /api/auth/me/password`

- Primer login: `{ newPassword }`
- Después: `{ currentPassword, newPassword }`

---

## 4. Usuario (sesión y admin)

### Modelo `User` (login, me, listado)

| Campo | Tipo | Label UI | Control |
|-------|------|----------|---------|
| `id` | uuid | — | oculto |
| `email` | email | Correo | texto readonly en perfil |
| `name` | string | Nombre | input |
| `mobilePhone` | string | Teléfono | input tel (vacío `""` si no hay) |
| `role` | enum | Rol | badge / select (solo admin/business al editar) |
| `isActive` | boolean | Activo | switch |
| `mustChangePassword` | boolean | Debe cambiar clave | badge |
| `createdAt` / `updatedAt` | date-time | — | secundario |

**Labels de rol**

| Valor | Label |
|-------|-------|
| `admin` | Administrador de plataforma |
| `business` | Dueño de empresa |
| `common` | Colaborador |

### Endpoints

| Método | Ruta | Auth | Roles | UI |
|--------|------|------|-------|-----|
| POST | `/api/auth/login` | no | — | Login |
| GET | `/api/auth/me` | sí | cualquiera | Bootstrap de sesión |
| PATCH | `/api/auth/me` | sí | cualquiera | Perfil (`name`, `mobilePhone`; `""` borra teléfono) |
| PATCH | `/api/auth/me/password` | sí | cualquiera | Cambio de clave |
| POST | `/api/auth/logout` | no | — | Informativo; borrar token en cliente |
| GET | `/api/users` | sí | admin, business | Tabla de usuarios. Query `?companyId=` solo admin |
| PATCH | `/api/users/:id` | sí | admin, business | Editar nombre, teléfono, rol |
| PATCH | `/api/users/:id/status` | sí | admin, business | Toggle `isActive`. 409 si se deshabilita a sí mismo |

Business solo ve/edita usuarios de **su** empresa. Sin empresa → `422`.

---

## 5. Invitaciones

### Modelo

| Campo | Tipo | Label UI |
|-------|------|----------|
| `id` | uuid | — |
| `email` | email | Correo |
| `name` | string | Nombre |
| `role` | `business` \| `common` | Rol invitado |
| `companyId` | uuid | Empresa (admin: selector) |
| `expiresAt` | date-time | Expira |
| `acceptedAt` | date-time \| null | `null` = pendiente |
| `createdAt` | date-time | Enviada |

`GET /api/invitations` solo lista **pendientes**.

### Formulario crear

| Campo | Admin | Business | Control |
|-------|-------|----------|---------|
| `email` | requerido | requerido | email |
| `name` | requerido | requerido | text |
| `companyId` | **obligatorio** | se ignora | select de `GET /api/companies` |
| `role` | **obligatorio** `business` o `common` | se ignora (siempre `common`) | select |

| Método | Ruta | Roles | UI |
|--------|------|-------|-----|
| POST | `/api/invitations` | admin, business | Modal invitar |
| GET | `/api/invitations` | admin, business | Tabla pendientes (`?companyId=` admin) |
| DELETE | `/api/invitations/:id` | admin, business | Revocar (204 sin body) |
| POST | `/api/auth/accept-invitation` | público | `/invitar` |

409: email ya usuario o invitación pendiente duplicada.

---

## 6. Empresa

### Ficha (`Company`)

| Campo | Tipo | Label UI | Control | Required al guardar |
|-------|------|----------|---------|---------------------|
| `id` | uuid | — | oculto | — |
| `name` | string 1–255 | Razón social | input | sí |
| `rut` | string 1–32 | RUT | input | sí |
| `address` | string \| null | Dirección | input | no |
| `city` | string \| null | Ciudad | input | no |
| `contact` | string \| null | Contacto | input | no |
| `logoUrl` | url \| null | Logo | preview + file | no |
| `createdAt` / `updatedAt` | date-time | — | — | — |

Logo: PNG/JPG/GIF/WebP, máx. 5 MB. El servidor lo convierte a WebP. Enviar `PUT /api/company` como `multipart/form-data` con campo archivo `logo` **o** JSON sin archivo.

| Método | Ruta | Roles | UI |
|--------|------|-------|-----|
| GET | `/api/company` | admin, business, common | Ficha de “mi empresa”. 404 = no configurada |
| PUT | `/api/company` | **solo business** | Formulario edición + upload logo. Common → 403 |
| GET | `/api/companies` | **solo admin** | Listado de todas las empresas |
| POST | `/api/companies` | **solo admin** | Crear empresa (sin dueño). Después invitar un `business` |

### Términos y condiciones

Respuesta:

```json
{
  "terms": ["Forma de pago: 50% al aceptar…", "Los precios están en CLP."],
  "updatedAt": "2026-09-22T12:00:00.000Z"
}
```

| Método | Ruta | Roles | UI |
|--------|------|-------|-----|
| GET | `/api/company/terms` | admin, business, common | Lista. Si nunca se guardaron, viene la lista **por defecto** |
| PUT | `/api/company/terms` | **solo business** | Editor de lista. Body `{ "terms": string[] }`. Se recortan vacíos; debe quedar ≥ 1 ítem |

Usar estos `terms` en la vista/PDF de cotización.

---

## 7. Cotizaciones

Recurso compartido por **empresa** (business y common ven las mismas). Admin → 403. Sin empresa → listado `[]` o `422` al crear.

### Modelo

| Campo | Tipo | Label UI | Control | Required crear |
|-------|------|----------|---------|----------------|
| `id` | uuid | — | oculto | — |
| `clientName` | string | Cliente / razón social | input | sí |
| `clientRut` | string \| null | RUT cliente | input | no |
| `clientEmail` | email \| null | Correo cliente | email | no (sí hace falta para enviar) |
| `projectTitle` | string \| null | Título del proyecto | input | no |
| `projectDeadline` | string \| null | Fecha límite | date o text | no |
| `projectNotes` | string \| null | Notas | textarea | no |
| `validUntil` | `YYYY-MM-DD` \| null | Validez de la oferta | date | no |
| `status` | enum | Estado | badge (no input libre) | default `draft` |
| `items` | array ≥ 1 | Ítems | tabla editable | sí |
| `total` | number | Total | **solo lectura** (lo calcula el server) | — |
| `createdAt` / `updatedAt` | date-time | — | — | — |

### Ítem

| Campo | Tipo | Label UI | Notas |
|-------|------|----------|-------|
| `id` | string | — | El front puede mandar uno (ej. `${Date.now()}-0`); si omite, el server lo genera |
| `description` | string 1–1000 | Descripción | text |
| `quantity` | int ≥ 1 | Cantidad | number |
| `unitPrice` | number ≥ 0 | Precio unitario | number CLP |
| `subtotal` | number | Subtotal | En **input** el front manda un int ≥ 1; en **respuesta** el server recalcula. Mostrar `quantity * unitPrice` |

### Estados (`status`)

| Valor | Label | Color sugerido | Quién lo setea |
|-------|-------|----------------|----------------|
| `draft` | Borrador | gris | crear / default |
| `sent` | Enviada | azul | `POST /:id/send` |
| `approved` | Aprobada | verde | `PATCH /:id/status` |
| `rejected` | Rechazada | rojo | `PATCH /:id/status` |
| `expired` | Expirada | ámbar | **solo server**: si `validUntil` ya pasó y estaba `draft` o `sent` |

Transiciones que debe respetar la UI:

- Enviar: `draft` → `sent` (también reenvío si ya está `sent`)
- Aprobar/rechazar: **solo** desde `sent` vigente → `approved` \| `rejected`
- No enviar ni cambiar estado si está `approved`, `rejected` o `expired` (409)

### Endpoints

| Método | Ruta | UI |
|--------|------|-----|
| GET | `/api/quotations` | Listado, orden creado desc |
| GET | `/api/quotations/:id` | Detalle / editor |
| POST | `/api/quotations` | Crear (201) |
| PUT | `/api/quotations/:id` | Reemplazo **completo** (mismos campos que crear) |
| POST | `/api/quotations/:id/send` | Botón “Enviar al cliente”. Requiere `clientEmail` y empresa |
| PATCH | `/api/quotations/:id/status` | Botones Aprobar / Rechazar. Body `{ "status": "approved" \| "rejected" }` |
| GET | `/api/quotations/:id/pdf` | Descarga `application/pdf` (`Content-Disposition: attachment`) |

`PUT` no es PATCH: hay que reenviar `items` y el resto de campos.

---

## 8. Clientes potenciales (leads)

Misma tenancy que cotizaciones: empresa, roles `business` y `common`. Admin → 403.

### Modelo

| Campo | Tipo | Label UI | Control | Alta |
|-------|------|----------|---------|------|
| `id` | uuid | — | — | — |
| `name` | string 1–255 | Nombre | input | requerido |
| `website` | url \| null | Sitio web | url | opcional |
| `emails` | email[] | Correos | lista de emails | opcional (máx. 10) |
| `phones` | string[] | Teléfonos | lista de tels | opcional (máx. 10, cada uno 1–64) |
| `tags` | string[] | Etiquetas | chips / multi | opcional (máx. 20, cada uno 1–40) |
| `status` | enum | Estado | select / pipeline | al crear siempre `not_contacted` |
| `contacts` | objeto bool | Canales contactados | 3 switches | al crear todo `false` |
| `activities` | array | Timeline | lista cronológica | al crear: actividad `created` |
| `createdAt` / `updatedAt` | date-time | — | — | — |

`emails` y `phones` reemplazan los antiguos campos únicos `email` / `phone`. El front debe usar siempre los arreglos.

#### Tags

- Lista libre por cliente (sin catálogo).
- Normalización en servidor: trim, minúsculas, espacios internos → guion.
- Patrón: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (ej. `matriculas`, `rondas-app`).
- Deduplicados. En `PATCH`, enviar `tags` reemplaza la lista; omitir no la toca; `[]` la vacía.
- Cambiar tags / emails / phones **no** genera actividad en el timeline.

### Estados del lead

| Valor | Label |
|-------|-------|
| `not_contacted` | Sin contactar |
| `pending` | Pendiente |
| `no_answer` | No contesta |
| `approved` | Aprobado |
| `rejected` | Rechazado |

### Canales `contacts`

| Campo | Label |
|-------|-------|
| `email` | Correo |
| `phone` | Teléfono |
| `whatsapp` | WhatsApp |

Un `PATCH` que cambie `status` o un canal genera actividad automática en `activities`.

### Actividad (`activities[]`)

| Campo | Tipo | Uso UI |
|-------|------|--------|
| `id` | uuid | key |
| `type` | enum | icono |
| `message` | string | texto del evento |
| `createdAt` | date-time | hora |
| `createdByName` | string \| null | autor (notas) |
| `meta` | object \| null | detalle (ver abajo) |

| `type` | Label | `meta` |
|--------|-------|--------|
| `created` | Creado | `null` |
| `status_changed` | Cambio de estado | `{ "from": "not_contacted", "to": "pending" }` |
| `channel_toggled` | Canal | `{ "channel": "email" \| "phone" \| "whatsapp", "value": true }` |
| `note` | Nota | `null` |

### Endpoints

| Método | Ruta | UI |
|--------|------|-----|
| GET | `/api/clients` | Kanban / tabla. Cada ítem trae `activities`. Query opcional `tag` (repetible): OR sobre tags |
| POST | `/api/clients` | Alta. `name` + opcionales (`website`, `emails`, `phones`, `tags`). 201 |
| PATCH | `/api/clients/:id` | Edición parcial (`name`, `website`, `emails`, `phones`, `tags`, `status`, `contacts`) |
| DELETE | `/api/clients/:id` | Eliminar (204 sin body) |
| POST | `/api/clients/:id/activities` | Agregar nota. Body `{ "message": "…" }` 1–5000. Devuelve el **cliente completo** |

Ejemplos de query: `GET /api/clients?tag=matriculas` o `GET /api/clients?tag=matriculas&tag=rondas-app` (clientes con **al menos uno** de esos tags).

En `PATCH`, string vacío en `website` se guarda como `null`. `emails` / `phones` / `tags` se reemplazan enteros si vienen en el body.

---

## 9. Feedback

Cualquier usuario autenticado puede crear y listar **el suyo**. Panel global solo `admin`.

### Modelo

| Campo | Tipo | Label UI |
|-------|------|----------|
| `id` | uuid | — |
| `userId` | uuid | — |
| `userEmail` | string | Correo del autor (admin) |
| `userName` | string? | Nombre del autor (admin) |
| `title` | string ≥ 3 | Título |
| `category` | enum | Categoría |
| `description` | string ≥ 10 | Detalle |
| `status` | enum | Estado (admin) |
| `priority` | enum | Prioridad (admin) |
| `createdAt` / `updatedAt` | date-time | — |

**Categoría** (formulario usuario)

| Valor | Label |
|-------|-------|
| `idea` | Idea |
| `feature` | Nueva función |
| `improvement` | Mejora |
| `complaint` | Queja |
| `opinion` | Opinión |
| `bug` | Error |
| `other` | Otro |

**Estado** (solo lectura para el usuario; el alta sale en `pending`)

| Valor | Label |
|-------|-------|
| `pending` | Pendiente |
| `reviewed` | Revisado |
| `planned` | Planificado |
| `done` | Hecho |
| `rejected` | Rechazado |

**Prioridad** (admin)

| Valor | Label |
|-------|-------|
| `high` | Alta |
| `medium` | Media |
| `low` | Baja |

Al crear, `priority` inicial es `medium` y `status` es `pending`.

| Método | Ruta | Roles | UI |
|--------|------|-------|-----|
| POST | `/api/feedback` | cualquiera | Formulario sugerencia |
| GET | `/api/feedback` | cualquiera | “Mis sugerencias” |
| GET | `/api/feedback/all` | admin | Panel. Query opcional `status`, `category`, `priority` |
| GET | `/api/feedback/:id` | admin | Modal detalle |
| PATCH | `/api/feedback/:id/priority` | admin | Cambiar prioridad `{ "priority": "high" }` |

---

## 10. App

| Método | Ruta | UI |
|--------|------|-----|
| GET | `/api` | Health léger. Texto plano de bienvenida |

---

## 11. Cómo generar la UI desde este contrato

1. Arrancar la API y leer `GET /api/openapi.json` (schemas, required, enums, ejemplos).
2. Usar este archivo para **labels en español**, transiciones de estado, roles por pantalla y flujos que OpenAPI no expresa (p. ej. “expired lo calcula el server”, “logout no invalida el JWT”, “PUT de cotización es reemplazo total”).
3. Pintar menú según `user.role`.
4. Formularios: campos `required` del schema OpenAPI + validaciones de longitud/enum de aquí.
5. Tablas/kanban: arrays de los GET de listado.
6. Badges: mapas de enums de las secciones 4–9.
7. Errores: mostrar `message` del sobre; 401 → login; 403 → “sin permiso”; 422 de empresa → CTA a configurar ficha.

Ejemplo mínimo de cliente (TypeScript):

```ts
const res = await fetch(`${API_URL}/api/openapi.json`);
const spec = await res.json();
// spec.paths, spec.components.schemas
```

Herramientas habituales: `openapi-typescript`, Orval, o un agente que lea `openapi.json` + este markdown.
