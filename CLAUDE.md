# CLAUDE.md

Guía para trabajar en este repositorio. Ya existe el scaffold inicial de `frontend/`
y `backend/` (ver "Convenciones de desarrollo"). Este archivo fija las decisiones ya
tomadas para que la implementación siga consistente.

## Qué es este proyecto

App web educativa de matemáticas gamificada para niños de 3 a 12 años, estilo
Duolingo pero enfocada exclusivamente en matemáticas. Web responsiva (desktop,
tablet, móvil), sin instalación.

- **Fuente de verdad para implementar:** [`spec.md`](./spec.md) — visión, usuarios y
  casos de uso, funcionalidades, flujos de usuario, arquitectura y requisitos no
  funcionales, ya acotados al alcance de v1. Es el documento que hay que leer y seguir
  antes de escribir código: si algo no está en `spec.md`, no entra en v1.
- **Contexto de producto (por qué):** [`PRD.md`](./PRD.md) — problema, objetivo,
  criterios de éxito, casos borde y riesgos abiertos. Útil para entender la motivación
  detrás de una decisión de `spec.md`, pero no es el documento a seguir para el "qué"
  implementar.
- **Especificación funcional completa (sin acotar):** [`funcionalidad.md`](./funcionalidad.md) —
  jerarquía de contenido, tipos de actividad, sistema de progreso/gamificación, panel
  administrativo (post-v1) y reglas funcionales. Incluye features de versiones
  futuras; `spec.md` ya filtró qué de todo esto entra en v1.

Antes de implementar algo que aparece en `funcionalidad.md` pero no en `spec.md`,
confirmar con el usuario — probablemente es una feature de una versión futura, no de
v1.

## Alcance de la v1 (resumen — ver spec.md para el detalle)

Incluye: contenido Curso→Unidad→Nivel→Lección→Pregunta cargado directo a la base de
datos (**sin panel administrativo**), **una sola franja etaria (6-8 años, Básico)**,
preguntas de selección múltiple y selección por imágenes, validación con
retroalimentación inmediata, progreso/desbloqueo de niveles, estrellas/puntos básicos,
perfil de padre/tutor, y simulacros.

No incluye en v1: las franjas 3-5 y 9-12 años (quedan para versiones posteriores),
panel admin, preguntas dinámicas/adaptación por IA, otros tipos de actividad
(arrastrar/soltar, relacionar, ordenar), personalización de avatar, modo offline/PWA,
rachas, logros, notificaciones, integración con sistemas del colegio.

## Stack técnico

- **Frontend:** React + Vite, TypeScript.
- **Backend:** Node.js + Express, TypeScript, como proyecto separado del frontend (no
  monorepo con framework full-stack).
- **Base de datos:** PostgreSQL, accedida desde el backend vía **Prisma** (migraciones
  versionadas en `backend/prisma/`).
- **Gestor de paquetes:** npm, en ambos proyectos de forma independiente (cada uno con
  su propio `package.json` y `package-lock.json`).

## Usuarios y audiencias

Una sola franja etaria de estudiante en v1: **6-8 años (Básico)**, foco en operaciones
básicas y razonamiento matemático. Al leer con más fluidez que la franja Inicial
(3-5), no depende críticamente de narración de audio en v1. Las franjas 3-5 y 9-12
quedan para versiones posteriores. Dos audiencias de decisión/consulta: padres/tutores
y colegios/docentes. Piloto inicial: **Colegio Micelino**.

## Consideraciones no negociables

El producto está dirigido a menores de edad. Cualquier funcionalidad que toque datos
personales, cuentas, o contenido debe considerar desde el diseño:

- Minimización de datos personales de los niños.
- Separación clara entre la experiencia del niño y la sección de padres/control
  parental (evitar que un niño acceda accidentalmente a configuración o datos del
  padre).
- El contenido educativo debe poder actualizarse sin depender de una nueva versión
  de la aplicación (aun sin panel admin en v1, el contenido vive en la base de datos,
  no hardcodeado en el frontend).

## Convenciones de desarrollo

### Estructura del repo

```text
frontend/   React + Vite + TS — experiencia del niño y sección de padres/tutores
backend/    Node.js + Express + TS + Prisma — API REST sobre PostgreSQL
docker-compose.yml   Postgres local para desarrollo (no usar en producción)
```

`frontend/` y `backend/` son proyectos npm independientes: cada uno se instala y
corre por separado, no hay un `package.json` raíz.

### Backend (`backend/`)

- `src/routes` → `controllers` (capa fina) → `services` (lógica de negocio, únicos
  que llaman a Prisma) → `prisma/schema.prisma` (modelo de datos).
- `src/middleware`: `auth.ts` (dos sesiones en cookie httpOnly+JWT con audiencia
  propia: `requireParentAuth` para `/api/padres` y `requireStudentSession` para las
  rutas del niño; el `estudianteId` sale siempre de la sesión, nunca del body),
  `validate.ts` (valida body/params/query con zod),
  `errorHandler.ts` (nunca expone stack traces en producción), `rateLimiters.ts`.
- `src/config/env.ts` valida las variables de entorno con zod al arrancar — si falta
  una, el servidor no levanta. Copiar `.env.example` a `.env` antes de correrlo.
- Seguridad ya configurada en `src/app.ts`: helmet, CORS restringido a
  `CORS_ORIGIN`, límite de tamaño de body, rate limiting, logging sin datos
  personales (`src/lib/logger.ts` redacta email/password/cookies).
- Comandos: `npm run dev` (con recarga), `npm run build`, `npm run typecheck`,
  `npm run lint`, `npm run prisma:migrate` (crear/aplicar migración en dev),
  `npm run prisma:generate`, `npm run prisma:seed` (contenido de ejemplo y
  cuenta demo, idempotente), `npm test`.
- Tests (`backend/test/`, Vitest + Supertest): integración de la API completa
  contra la base `TEST_DATABASE_URL` (por defecto `matematicas_kids_test`, que se
  crea y migra sola). Se vacía en cada archivo, así que el nombre **debe**
  terminar en `_test` o los tests se niegan a correr. Cada archivo arma su propio
  contenido mínimo con `test/helpers/db.ts`, no usa el seed. Requiere el Postgres
  de `docker compose up -d`.
- Nunca exponer en una respuesta al niño cuál opción de una pregunta es la correcta
  (ver el comentario en `contenido.service.ts`) — la validación de respuestas es
  siempre server-side (`progreso.service.ts`).

### Frontend (`frontend/`)

- `src/pages/estudiante` y `src/pages/padre` están separadas a propósito, reflejando
  la separación niño/padre. `src/components/padre/PuertaParental.tsx` es el filtro de
  acceso accidental de un niño a `/padres`; `RutaProtegidaPadre.tsx` es el guard real
  de sesión (verificada contra el backend, nunca solo en el cliente).
  `src/components/estudiante/RutaEstudiante.tsx` es el guard equivalente del niño:
  sin perfil activo en el dispositivo, pide que un adulto lo active desde `/padres`.
- `src/services/*Service.ts` son la única capa que llama a la API (vía
  `httpClient.ts`, con `withCredentials` para la cookie de sesión). Los componentes no
  llaman a `axios`/`fetch` directamente.
- `src/config/env.ts` valida `VITE_API_URL` al arrancar. Copiar `.env.example` a
  `.env.local` antes de correr `npm run dev`.
- Comandos: `npm run dev`, `npm run build` (incluye typecheck), `npm run lint`
  (oxlint), `npm run test:e2e`.
- Test de punta a punta (`frontend/e2e/`, Playwright Test): una familia nueva se
  registra, el niño juega una lección y un simulacro, y el padre ve el progreso,
  en móvil y escritorio. Levanta backend (puerto 3101) y frontend (5174) propios
  sobre la base `matematicas_kids_e2e` (migrada y con seed, sin borrar nada), así
  que puede correr con `npm run dev` abierto. Usa el Chrome instalado
  (`PW_CHANNEL` para otro; con Edge en Windows el proceso no termina al final).
- Diseño: "cuaderno cuadriculado" (tokens y componentes en `src/index.css`).
  Errores en naranja, nunca en rojo. Tipografía Andika empaquetada
  (`@fontsource/andika`), no desde Google Fonts, para no enviar datos de los niños
  a terceros.

### Convenciones generales

- Nombres de dominio (Curso, Unidad, Nivel, Lección, Pregunta, Progreso, etc.) en
  español, igual que en `spec.md`/`funcionalidad.md` — es el lenguaje del producto.
  Nombres de infraestructura/código (carpetas, tipos genéricos) en inglés cuando no
  hay un término de dominio de por medio.
- No commitear `.env`/`.env.local` (ya están en `.gitignore` de cada proyecto); solo
  `.env.example` se versiona.
</content>
