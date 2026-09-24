# API de cotizaciones

## Variables de entorno

Copiar [`.env.example`](.env.example) a `.env` y configurar Postgres y JWT (`JWT_SECRET`, `JWT_EXPIRES_IN` ejemplo `900s`).

Usuario inicial (**desarrollo**): definir `SEED_EMAIL`, `SEED_PASSWORD` y ejecutar:

```bash
pnpm run migration:run
pnpm run seed:user
```

## Contrato para el front

El front debe generar pantallas a partir de este contrato, no al revés.

| Recurso | URL |
|---------|-----|
| Guía de UI (roles, labels, flujos, enums) | [`docs/contrato-front.md`](docs/contrato-front.md) |
| OpenAPI JSON (tipos, required, ejemplos) | `http://localhost:3000/api/openapi.json` |
| OpenAPI YAML | `http://localhost:3000/api/openapi.yaml` |
| Swagger UI | `http://localhost:3000/api/docs` |
| Copia estática del spec | [`docs/openapi.json`](docs/openapi.json) |

Con la API levantada, regenerar la copia estática:

```bash
pnpm run openapi:export
```

Auth de sesión:

| Método | Ruta | Descripción |
|--------|------|--------------|
| `POST` | `/api/auth/login` | Body `{ email, password }` → `{ user, token, expiresIn }` |
| `GET` | `/api/auth/me` | Header `Authorization: Bearer <jwt>` |
| `POST` | `/api/auth/logout` | `{ message: "Logout exitoso" }` |

## TypeORM migrations

Este proyecto usa `synchronize: false` y el data source CLI en [`src/data-source.ts`](src/data-source.ts).

```bash
pnpm run migration:run
pnpm run migration:revert
```

Para generar una migration nueva según tus entidades:

```bash
pnpm exec typeorm-ts-node-commonjs migration:generate src/migrations/NombreMigracion -d src/data-source.ts
```

## Desarrollo

```bash
pnpm install
pnpm run migration:run
pnpm run seed:user
pnpm run start:dev
```