# AGENTS.md

## Descripción general

SaaS para gestionar los clientes de una empresa. Este software permite generar cotizaciones y dar seguimiento de estas. Además tiene la posibilidad de agregar posibles clientes y tener metricas de cuantos clientes se han ido captando en el transcurso de un periodo de tiempo.

Tiene la posibilidad de enviar correos electronicos y notificar al usuario para solicitar novedades acerca de la propuesta a cada cliente según el tiempo que el defina.


## Reglas no negociables (landing)

Este subproyecto es un sitio React,
independiente del stack de la app móvil (Expo/RN, offline-first, GPS) — esas
reglas viven en `../docs/company-terms-api.md` y no aplican aquí. El formulario de
contacto corre on-demand en Netlify (
`resend`) para no exponer `RESEND_API_KEY`. Para `landing/` rigen estas en su
lugar:

1. **Stack.** React + TypeScript en modo `strict` (ya configurado en
   `tsconfig.json`).
   Dependencias actuales ajenas a Tailwind, `resend` (envío de correo
   del formulario) y `react-router`. Cualquier
   dependencia nueva se justifica por escrito en el PR que la introduce.
2. **Idioma.** Identificadores y commits en inglés; comentarios y documentación
   en español; todo texto visible al usuario en español.

## Contexto de negocio

@../docs/company-terms-api.md describe el flujo de negocio. Léelos antes de proponer cambios de alcance o diseño de contenido.

## Metodología: Spec-Driven Development (SDD)

Este proyecto sigue SDD para features que tocan más de un archivo o capa
(DB, API, UI). Los bugfixes simples y cambios triviales de una línea
no requieren este flujo.

### Ubicación de los documentos

Cada feature vive en `landing/.specs/<numero>-<nombre-corto>/` con:

- `spec.md` — qué debe hacer, qué queda fuera de alcance, criterios de aceptación
- `plan.md` — diseño técnico: archivos a tocar, contratos, algoritmo
- `tasks.md` — lista numerada y ordenada de tareas ejecutables
- `status.md` — estado actual y qué sigue (para retomar entre sesiones)

Plantilla base: `landing/.specs/_templates/` (independiente de `../.specs/` en
la raíz, que es para la app móvil).

### Reglas de flujo (IMPORTANTE)

1. **Nunca escribas código de una feature nueva sin spec.md aprobado.**
   Si no existe, propón uno primero y espera confirmación antes de seguir.
2. **No pases de spec a plan, ni de plan a tasks, sin que yo lo apruebe.**
   Genera el documento y detente — no continúes automáticamente a la siguiente fase.
3. **Sigue tasks.md en orden.** No te adelantes a tareas futuras ni reordenes
   sin avisar primero.
4. **Actualiza status.md** después de cada tarea completada: qué se hizo,
   qué sigue, y cualquier decisión o desvío del plan original.
5. **Si el plan resulta inviable durante la implementación**, detente y
   avísame en vez de improvisar una solución distinta silenciosamente.

### Convención de numeración

Las specs se numeran secuencialmente y de forma independiente a
las de la raíz: `001-`, `002-`, etc. Antes de crear una nueva, revisa
`.specs/` para usar el siguiente número disponible.

## Comandos de desarrollo

Para ver la landing sin el emulador de Edge Functions de Netlify: `pnpm local`.
`pnpm dev` sigue con el adapter y esa emulación.

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentación

Full documentation: https://es.react.dev/reference/react

