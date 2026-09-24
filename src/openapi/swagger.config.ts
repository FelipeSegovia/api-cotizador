import { DocumentBuilder } from '@nestjs/swagger';

export const OPENAPI_JSON_PATH = 'api/openapi.json';
export const OPENAPI_YAML_PATH = 'api/openapi.yaml';
export const OPENAPI_UI_PATH = 'api/docs';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Cotizador API')
    .setDescription(
      [
        'Contrato OpenAPI 3 para el front (`cotizador-app`).',
        '',
        'Prefijo global: `/api`. Auth: header `Authorization: Bearer <jwt>` (scheme `access-token`).',
        'JSON vivo: `GET /api/openapi.json`. UI: `/api/docs`.',
        'Guía de pantallas, roles y labels: `docs/contrato-front.md`.',
        '',
        'Errores: `{ statusCode, message, traceId? }`. `message` puede ser `string` o `string[]` (validación).',
        'Montos en CLP (número). Fechas de negocio `YYYY-MM-DD`; timestamps ISO-8601.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /api/auth/login',
      },
      'access-token',
    )
    .addTag('App', 'Comprobaciones básicas del servicio')
    .addTag('Autenticación', 'Login, perfil, logout, recuperación e invitaciones públicas')
    .addTag('Usuarios (Admin)', 'Gestión de usuarios (admin de plataforma y business de empresa)')
    .addTag('Invitaciones', 'Alta de usuarios por invitación (admin y business)')
    .addTag('Empresa', 'Ficha y términos de la empresa del usuario autenticado')
    .addTag('Empresas (Admin)', 'CRUD de empresas para admin de plataforma')
    .addTag('Cotizaciones', 'CRUD, envío por correo y PDF (business y common)')
    .addTag('Clientes potenciales', 'Leads y timeline de la empresa (business y common)')
    .addTag('Feedback', 'Sugerencias de usuarios y panel admin')
    .build();
}
