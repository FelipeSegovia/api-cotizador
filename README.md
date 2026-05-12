# API de cotizaciones

## Variables de entorno

Copiar [`.env.example`](.env.example) a `.env` y configurar Postgres y JWT (`JWT_SECRET`, `JWT_EXPIRES_IN` ejemplo `900s`).

Usuario inicial (**desarrollo**): definir `SEED_EMAIL`, `SEED_PASSWORD` y ejecutar:

```bash
pnpm run migration:run
pnpm run seed:user
```

## Auth (contrato front)

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