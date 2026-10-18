# Reporte de seguridad — Matemáticas Kids (v1)

- **Fecha de la auditoría:** 2026-10-18
- **Commit revisado:** `f9da30d` (Versión inicial)
- **Alcance:** `backend/` (Express + Prisma), `frontend/` (React + Vite), `docker-compose.yml`, dependencias (`npm audit` de ambos proyectos).
- **Método:** revisión manual del código con el modelo de amenazas de abajo, y `npm audit` contra los `package-lock.json` versionados.

> **Cómo usar este documento:** cada hallazgo tiene una casilla. Marcar `[x]` cuando esté
> resuelto y anotar debajo, en **Resolución**, el commit o PR y cómo se verificó.
> Si se decide no corregir algo, marcarlo con `[~]` y dejar el motivo y una fecha de revisión.

## Resumen

| Severidad | Cantidad | Resueltos |
|---|---|---|
| 🔴 Alta | 3 | 3 |
| 🟠 Media | 7 | 1 |
| 🟡 Baja | 9 | 1 |
| ⚪ Informativa / buenas prácticas | 5 | 0 |

### Lo que ya está bien

Para no romperlo al corregir lo demás:

- Contraseñas con bcrypt, 12 rondas, y rechazo explícito de contraseñas de más de 72 bytes.
- Cookies de sesión `httpOnly` y `sameSite: 'strict'`, con JWT de audiencia separada para el padre y para el niño.
- El `estudianteId` sale siempre de la sesión y nunca del body. El acceso del padre a datos de un hijo está filtrado por `padreTutorId` (sin IDOR).
- `esCorrecta` nunca se envía al cliente antes de tiempo, y la validación de respuestas, intentos, desbloqueo y tiempo del simulacro ocurre en el servidor.
- Validación con zod en las rutas que reciben datos, Prisma sin SQL crudo, helmet, CORS con un origen explícito, body limitado a 100 kb.
- Mismo mensaje en el login para un correo inexistente y para una contraseña incorrecta. Rate limit en login y en registro.
- No hay `dangerouslySetInnerHTML`, `eval` ni tokens en `localStorage`. Variables de entorno validadas al arrancar. `.env` en `.gitignore`.
- Datos del niño minimizados: solo un nombre o apodo de hasta 40 caracteres.

---

## Modelo de amenazas (resumen)

**Activos:** credenciales y sesión del padre/tutor, sesión del niño en el dispositivo, datos de progreso del niño (un menor), correo del padre, integridad del progreso y de la gamificación.

**Fronteras de confianza:**

1. Navegador → API (`/api/padres/*`, `/api/progreso/*`, `/api/simulacros/*`, `/api/contenido/*`, `/api/estudiante/*`).
2. Proxy/balanceador → Express (cabeceras `X-Forwarded-*`).
3. Base de datos → frontend (el contenido se carga a mano en la BD: `imagenUrl`, `enunciado`, etc.).
4. Dispositivo compartido: el niño y el padre usan el mismo navegador.
5. Logs del servidor → quien tenga acceso a ellos.

---

## 🔴 Severidad alta

### - [x] SEC-01 · Los JWT de sesión quedan escritos en los logs (`Set-Cookie`)

- **Dónde:** `backend/src/lib/logger.ts:11-19`, `backend/src/app.ts:30`
- **Qué pasa:** `pino-http` serializa por defecto `res.headers`, y eso incluye `set-cookie`. La lista `redact` cubre `req.headers.cookie` pero **no** `res.headers["set-cookie"]`. Cada login, registro y activación de dispositivo deja en el log un JWT válido: 1 día para el padre, **180 días** para el niño.
- **Impacto (STRIDE: I, S):** cualquiera con acceso a los logs (plataforma de hosting, agregador de logs, un desarrollador) puede suplantar a un padre o a un niño.
- **Corrección propuesta:** agregar `'res.headers["set-cookie"]'` a `redact.paths`, o mejor, definir `serializers` propios en `pinoHttp` que solo registren `method`, `url` sin query y `statusCode`. Agregar un test que capture la salida del logger en un login y verifique que no aparece el token.
- **Resolución (2026-10-18):** `httpLogSerializers` en `backend/src/lib/logger.ts`, usado en `app.ts`: cada request se registra solo con `id`, `method`, `url` sin query y `statusCode`, sin cabeceras, IP ni user-agent. Como respaldo se agregó `res.headers["set-cookie"]` a `redact`. Test: `backend/test/configuracion.test.ts` ("logs de cada request"). Verificado además con `pino-http` real: antes el token aparecía en el log, ahora no.

### - [x] SEC-02 · `trust proxy` fijo en 1 permite saltarse el rate limit con `X-Forwarded-For`

- **Dónde:** `backend/src/app.ts:18`, `backend/src/middleware/rateLimiters.ts`
- **Qué pasa:** `app.set('trust proxy', 1)` se aplica siempre. Si la API queda expuesta sin un proxy delante (desarrollo, un despliegue simple o un proxy con otra cantidad de saltos), `req.ip` se toma del `X-Forwarded-For` que manda el cliente. Un atacante cambia esa cabecera en cada request y cada intento cuenta como una IP nueva.
- **Impacto (STRIDE: S, D):** se anula el `loginLimiter` (fuerza bruta de contraseñas de padres) y el `registroLimiter` (creación masiva de cuentas y enumeración de correos).
- **Corrección propuesta:** sacar `trust proxy` a una variable de entorno validada en `env.ts` (por ejemplo `TRUST_PROXY`, que por defecto sea `false`) y fijarla según la topología real de producción. Complementar con un límite por cuenta (ver SEC-07).
- **Resolución (2026-10-18):** nueva variable `TRUST_PROXY` en `env.ts`: solo acepta `"false"` (el valor por defecto) o un número de saltos, y rechaza `"true"`. `app.ts` usa `env.TRUST_PROXY`. Documentada en `.env.example`. Test: "rate limit sin proxy de confianza" hace 6 registros, cada uno con un `X-Forwarded-For` distinto, y espera 429 en el sexto. **Con `TRUST_PROXY=1` el test falla, lo que reproduce el bug original.** ⚠️ **Al desplegar detrás de un proxy o balanceador, definir `TRUST_PROXY` con la cantidad real de saltos**; si no, todos los clientes comparten la IP del proxy y el rate limit los bloquea juntos.

### - [x] SEC-03 · Si falta `NODE_ENV`, producción corre en "modo desarrollo"

- **Dónde:** `backend/src/config/env.ts:7`, `backend/src/controllers/padre.controller.ts:11,80`, `backend/src/middleware/errorHandler.ts:40`, `backend/src/lib/logger.ts:21`
- **Qué pasa:** `NODE_ENV` tiene `.default('development')`. Si en el despliegue nadie lo define:
  - las cookies de sesión salen **sin `secure`** y pueden viajar por HTTP en claro;
  - las respuestas 500 incluyen `err.message`, que filtra detalles internos (errores de Prisma, nombres de tablas);
  - el logger intenta cargar `pino-pretty`, que es una devDependency, y queda en nivel `debug`.
- **Impacto (STRIDE: I):** robo de sesión en redes no cifradas y fuga de información interna.
- **Corrección propuesta:** hacer `NODE_ENV` obligatorio (sin default) o derivar `secure` de una variable explícita (`COOKIE_SECURE`). Que la app se niegue a arrancar si `CORS_ORIGIN` es `https://` y las cookies no son `secure`. Documentar las variables de producción.
- **Resolución (2026-10-18):** `NODE_ENV` ahora es obligatoria, sin default: si falta, el servidor no arranca. Con `NODE_ENV=production`, la app también se niega a arrancar si `CORS_ORIGIN` no es `https://`, porque con cookies `secure` un frontend en http no funcionaría. Tests: "variables de entorno" en `configuracion.test.ts`. Dev, los tests y el e2e ya definían `NODE_ENV`, así que no hubo que tocarlos.

---

## 🟠 Severidad media

### - [ ] SEC-04 · Las sesiones no se pueden revocar (logout y "quitar perfil del dispositivo" solo borran la cookie)

- **Dónde:** `backend/src/middleware/auth.ts`, `backend/src/controllers/padre.controller.ts:50-53,92-95`
- **Qué pasa:** los JWT no tienen estado. `POST /padres/logout` y `DELETE /padres/dispositivo` solo hacen `clearCookie`. Un token copiado (de los logs por SEC-01, de un dispositivo perdido, etc.) sigue siendo válido hasta que vence: **180 días** en el caso del niño. Tampoco hay forma de "cerrar todas las sesiones" ni de invalidarlas al cambiar la contraseña.
- **Impacto:** acceso prolongado al progreso de un menor o a la cuenta del padre.
- **Corrección propuesta:** guardar las sesiones en la BD (tabla `Sesion` con `jti`, `revocadaEn`, `expiraEn`) y verificarlas en `requireParentAuth` y `requireStudentSession`. Como alternativa mínima, un `sessionVersion` en `PadreTutor` y `Estudiante` incluido en el token. Desde `/padres`, permitir listar y revocar los dispositivos activos de cada hijo.
- **Resolución:**

### - [ ] SEC-05 · No hay borrado ni exportación de datos (derechos del titular, datos de menores)

- **Dónde:** `backend/src/routes/padre.routes.ts` (no existe el endpoint), `backend/prisma/schema.prisma`
- **Qué pasa:** el padre no puede borrar su cuenta, borrar el perfil de un hijo ni exportar sus datos. Tampoco hay una política de retención: `respuestas_registro`, `sesiones_leccion` y `sesiones_simulacro` crecen sin límite. El esquema ya usa `onDelete: Cascade`, así que el borrado es fácil de implementar.
- **Impacto:** incumplimiento de normativa de protección de datos (por ejemplo la Ley 29733 en Perú, COPPA o GDPR según el despliegue). Es un punto sensible para el piloto con un colegio.
- **Corrección propuesta:** confirmar el alcance con el producto (no está en `spec.md`). Como mínimo: `DELETE /padres/hijos/:id` y `DELETE /padres/cuenta`, con re-autenticación, y definir la retención de las sesiones abandonadas.
- **Resolución:**

### - [ ] SEC-06 · Enumeración de correos en registro y por tiempo de respuesta en login

- **Dónde:** `backend/src/services/padre.service.ts:17-28,40-42`
- **Qué pasa:**
  1. El registro responde `409 "Ya existe una cuenta con ese correo"`, lo que confirma si un correo está registrado. Hoy solo lo frena el rate limit, que se puede saltar (SEC-02).
  2. En el login, si el correo no existe se responde enseguida, sin ejecutar `bcrypt.compare`. Si existe, se tarda unos 250 ms. Esa diferencia de tiempo revela qué correos tienen cuenta.
- **Impacto (STRIDE: I):** se puede confirmar qué correos son de familias con hijos en la app, un dato útil para phishing dirigido.
- **Corrección propuesta:** en el login, comparar contra un hash ficticio cuando el padre no existe. Para el registro, aceptar el riesgo ya documentado o pasar a un flujo de verificación por correo (post-v1). Decidir y anotar aquí.
- **Resolución:**

### - [ ] SEC-07 · Los rate limiters guardan contadores en memoria y solo cuentan por IP

- **Dónde:** `backend/src/middleware/rateLimiters.ts`
- **Qué pasa:** con más de una instancia o tras un reinicio, los contadores se multiplican o se reinician. El límite de login cuenta solo por IP, sin límite por cuenta, así que un ataque distribuido contra un mismo correo no se detecta. Además, en un colegio muchos niños y padres comparten una IP (NAT): 300 req/15 min por IP en `apiLimiter` puede bloquear a un aula entera.
- **Corrección propuesta:** usar un store compartido (Redis o Postgres) cuando haya más de una instancia; agregar un límite de login por correo; aplicar `apiLimiter` a la experiencia del niño por `estudianteId` de la sesión en vez de por IP. Cualquier cambio de rate limit requiere aprobación (ver la skill).
- **Resolución:**

### - [ ] SEC-08 · `imagenUrl` sin restricciones: imágenes de terceros pueden rastrear a los niños

- **Dónde:** `frontend/src/components/estudiante/ContenidoOpcion.tsx:7`, `frontend/src/pages/estudiante/LeccionPage.tsx:180`, `frontend/src/pages/estudiante/SimulacroPage.tsx:218`, `backend/prisma/schema.prisma` (`Pregunta.imagenUrl`, `Opcion.imagenUrl`)
- **Qué pasa:** cualquier URL cargada en la BD se renderiza tal cual en `<img src>`. Si el contenido apunta a un dominio externo, el navegador del niño le envía su IP, su user-agent y el `Referer` a ese tercero. Esto va contra la misma razón por la que se empaquetó la fuente Andika. Tampoco hay CSP en el frontend que lo impida (ver SEC-09).
- **Corrección propuesta:** servir las imágenes desde el mismo origen o desde un bucket propio; validar en el seed o en la carga que `imagenUrl` sea relativa o de un host permitido; CSP `img-src 'self' <cdn-propio>`; `referrerpolicy="no-referrer"` en las `<img>`.
- **Resolución:**

### - [ ] SEC-09 · El frontend no tiene cabeceras de seguridad ni CSP definidas

- **Dónde:** `frontend/index.html`, `frontend/vite.config.ts` (no hay configuración de despliegue)
- **Qué pasa:** helmet protege solo las respuestas de la API. El HTML/JS del frontend se servirá desde un hosting estático sin CSP, `X-Frame-Options`/`frame-ancestors`, HSTS ni `Referrer-Policy`. Sin `frame-ancestors`, el área de padres puede incrustarse en otro sitio (clickjacking).
- **Corrección propuesta:** definir las cabeceras en el hosting elegido (por ejemplo `_headers`, `vercel.json` o nginx). Punto de partida: `default-src 'self'; img-src 'self' data:; connect-src 'self' <API_URL>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`, más `Referrer-Policy: no-referrer` y HSTS.
- **Resolución:**

### - [x] SEC-10 · Dependencias con vulnerabilidades conocidas (`npm audit`)

- **Dónde:** `backend/package-lock.json`, `frontend/package-lock.json`
- **Resultado del 2026-10-18:**

  | Proyecto | Paquete | Severidad | Directo | Alcance real | Fix |
  |---|---|---|---|---|---|
  | backend | `vitest` (vía `tinypool`, GHSA-5gmw-xhrv-c9v3 / GHSA-85c8-ppgw-ccpr: prototype pollution → RCE) | crítica | sí (dev) | solo tests, no corre en producción | `vitest@5.0.5` (major) |
  | backend | `@vitest/mocker` (GHSA-82fw-gwwq-j7x9: path traversal) | moderada | no (dev) | solo tests | `vitest@5.0.5` (major) |
  | frontend | `source-map-js` (GHSA-68fv-2mgg-jv7q: DoS del event loop) | alta | no (dev/build) | build/dev server | `npm audit fix` (sin major) |

- **Triage:** ninguna está en el camino de ejecución de producción. Igual hay que corregirlas, porque afectan las máquinas de desarrollo y la CI.
- **Corrección propuesta:** frontend: `npm audit fix` (sin `--force`) y verificar `npm run build` y `npm run test:e2e`. Backend: actualizar `vitest` a 5.x a mano, leyendo el changelog, y correr `npm test`. Agregar `npm audit --omit=dev --audit-level=high` a la CI antes de cada release.
- **Resolución (2026-10-18):** `npm audit` da **0 vulnerabilidades** en los dos proyectos.
  - **Frontend:** `npm audit fix` sin `--force`. Solo cambió `source-map-js` de 1.2.1 a 1.2.2 en el lockfile. `npm run build`, lint y e2e pasan.
  - **Backend:** `vitest` de 3.2.7 a **4.1.11**, no a la 5.0.5 que sugería `npm audit`. Motivos:
    - 4.1.11 ya corrige las tres advisories (`@vitest/mocker` es vulnerable en `<4.1.11`, y vitest 4 ya no depende de `tinypool`);
    - vitest 5 exige Node `^22.12`, y el backend declara `engines.node >=20`;
    - 4.1.11 tiene dos meses publicado, mientras que 5.0.5 y 4.1.12 salieron el 2026-10-15.
  - El cambio arrastra `vite` 7 → 8 (rollup → rolldown). Se revisó el diff del lockfile: entran 33 paquetes (`rolldown`, `lightningcss`, `@oxc-project/types` y sus binarios opcionales por plataforma, más `obug`, `detect-libc` y `convert-source-map`), salen 42 (`rollup` y sus binarios, `tinypool`, `vite-node`, etc.). **Ningún paquete nuevo tiene scripts de instalación.** La instalación se hizo con `--ignore-scripts`.
  - `vitest.config.ts` se renombró a `vitest.config.mts` para eliminar el aviso de ESM de Vite 8.
  - 60 tests, typecheck y lint pasan.
  - ⚠️ npm 10.9.3 falla con `Cannot read properties of null (reading 'edgesOut')` al instalar vitest 4 (bug de arborist con peers opcionales). Se instaló con `npx npm@11.6.2`. Un `npm ci` normal con npm 10 funciona sin problema.
  - **Pendiente:** el chequeo en CI queda para SEC-24.

---

## 🟡 Severidad baja

### - [ ] SEC-11 · `jwt.verify` no fija el algoritmo

- **Dónde:** `backend/src/middleware/auth.ts:32,60`
- **Qué pasa:** no se pasa `algorithms: ['HS256']`. jsonwebtoken 9 ya rechaza `none` y la confusión entre clave pública y secreto, así que el riesgo actual es bajo, pero fijar el algoritmo es la práctica recomendada. Tampoco se fija `issuer`.
- **Corrección propuesta:** `jwt.verify(token, secret, { audience, algorithms: ['HS256'], issuer: 'matematicas-kids' })` y lo mismo al firmar.
- **Resolución:**

### - [x] SEC-12 · El vencimiento de la cookie del padre no coincide con `JWT_EXPIRES_IN`

- **Dónde:** `backend/src/controllers/padre.controller.ts:13`, `backend/src/config/env.ts:12`
- **Qué pasa:** `maxAge` está fijo en 24 h, pero el JWT vence según `JWT_EXPIRES_IN`. Si alguien sube el valor a `30d`, el token vale 30 días aunque la cookie desaparezca antes del navegador. Si lo baja, la cookie sobrevive a un token ya vencido. Además, el `JWT_SECRET` de `.env.example` tiene más de 32 caracteres y **pasa la validación**: si se copia sin cambiarlo, el secreto es público.
- **Corrección propuesta:** derivar `maxAge` de una sola variable (por ejemplo `PARENT_SESSION_HOURS`). Rechazar en `env.ts` el valor de ejemplo de `JWT_SECRET` y exigir alta entropía en producción.
- **Resolución (2026-10-18):**
  - `JWT_EXPIRES_IN` se reemplazó por `PARENT_SESSION_HOURS` (entero, por defecto 24, máximo 168), que usan tanto el JWT (`auth.ts`) como el `maxAge` de la cookie (`padre.controller.ts`).
  - `JWT_SECRET` ahora rechaza el valor de `.env.example` y las cadenas con menos de 10 caracteres distintos (por ejemplo `"abab..."`). `.env.example` explica cómo generar uno (`openssl rand -hex 32`).
  - Tests en `configuracion.test.ts`: un login real compara el `exp - iat` del JWT con el `Max-Age` de la cookie. También pasa con `PARENT_SESSION_HOURS=48`, un caso que con el código anterior fallaba.
  - Nota: el `backend/.env` local todavía tiene `JWT_EXPIRES_IN=1d`. Se ignora, y se puede borrar.

### - [ ] SEC-13 · Un JSON mal formado o un body demasiado grande responde 500 en vez de 400/413

- **Dónde:** `backend/src/middleware/errorHandler.ts:21-42`
- **Qué pasa:** los errores de `express.json()` (`entity.parse.failed`, `entity.too.large`) traen `status`/`type`, pero el handler no los reconoce: los registra como "Error no controlado" y responde 500 (con `detalle` fuera de producción). Esto ensucia los logs, facilita inundar las alertas y da información de más.
- **Corrección propuesta:** si `err` tiene `status` entre 400 y 499 (errores de body-parser), responder con ese código y un mensaje genérico.
- **Resolución:**

### - [ ] SEC-14 · Condiciones de carrera al registrar respuestas (integridad de estrellas y puntos)

- **Dónde:** `backend/src/services/progreso.service.ts:50-85`, `backend/src/services/simulacro.service.ts:148-179`
- **Qué pasa:** el número de intento y la regla "ya respondida" se calculan leyendo y después escribiendo, sin transacción ni restricción única. Si se envían todas las opciones de una pregunta al mismo tiempo, todas quedan como `numeroIntento = 1` y la correcta puede contar como acierto al primer intento. En el simulacro, dos respuestas simultáneas a la misma pregunta crean dos registros y pueden inflar `correctas`.
- **Impacto:** se puede hacer trampa en la gamificación y se distorsionan los "temas a reforzar" que ve el padre.
- **Corrección propuesta:** índice único `(sesionSimulacroId, preguntaId)` para el simulacro. Para la lección, transacción `serializable` o un bloqueo por `(sesionLeccionId, preguntaId)`. Agregar un test con requests en paralelo.
- **Resolución:**

### - [ ] SEC-15 · Se pueden crear sesiones sin límite (`iniciar` lección/simulacro)

- **Dónde:** `backend/src/services/progreso.service.ts:13-27`, `backend/src/services/simulacro.service.ts:95-138`
- **Qué pasa:** cada `POST .../iniciar` crea una fila y nunca se limpian las abandonadas. Una sesión de niño válida puede insertar miles de filas (solo lo frena el `apiLimiter` por IP). Además, `listarSimulacros` hace una consulta por simulacro (N+1).
- **Corrección propuesta:** reutilizar la sesión abierta más reciente de la misma lección o simulacro, o limitar las sesiones abiertas por estudiante. Limpiar periódicamente las sesiones abandonadas (relacionado con la retención de SEC-05).
- **Resolución:**

### - [ ] SEC-16 · El contenido es público y no valida los parámetros de ruta

- **Dónde:** `backend/src/routes/contenido.routes.ts`
- **Qué pasa:** `/api/contenido/*` no exige sesión ni valida `unidadId`/`leccionId` con zod, a diferencia del resto de las rutas. Cualquiera puede descargar todo el contenido, incluidas las lecciones de niveles bloqueados. No expone respuestas correctas, así que el riesgo es bajo, pero es inconsistente con la convención del repo.
- **Corrección propuesta:** agregar `validate({ params: z.object({ ... uuid() }) })`. Decidir si el contenido debe requerir `requireStudentSession`.
- **Resolución:**

### - [ ] SEC-17 · Los logs guardan la IP y el user-agent de los niños

- **Dónde:** `backend/src/app.ts:30`, `backend/src/lib/logger.ts`
- **Qué pasa:** `pino-http` registra `remoteAddress`, `user-agent` y la URL completa de cada request. La IP es un dato personal y aquí pertenece a menores. No hay una retención definida para los logs.
- **Corrección propuesta:** serializadores propios sin IP (o con la IP truncada) y sin user-agent completo. Definir la retención de logs en la plataforma de hosting. Se resuelve junto con SEC-01.
- **Resolución (parcial, 2026-10-18):** con el arreglo de SEC-01, los logs ya no guardan IP, user-agent ni query string. **Falta** definir la retención de los logs en el hosting.

### - [ ] SEC-18 · `docker-compose.yml`: credenciales por defecto y puerto expuesto en todas las interfaces

- **Dónde:** `docker-compose.yml:6-10`
- **Qué pasa:** `postgres/postgres` y `ports: '5432:5432'`, que publica el puerto en `0.0.0.0`. En una red compartida (por ejemplo la del colegio o un café), cualquiera de esa red puede conectarse a la BD de desarrollo, que puede tener datos reales si alguien los cargó para probar.
- **Corrección propuesta:** `'127.0.0.1:5432:5432'` y leer la contraseña de un `.env`.
- **Resolución:**

### - [ ] SEC-19 · Nada impide correr el seed en producción, y trae una contraseña demo fija

- **Dónde:** `backend/prisma/seed.ts:361-396`
- **Qué pasa:** si no se define `SEED_PADRE_PASSWORD`, crea `padre.demo@example.com` / `demo-padre-123` e imprime la contraseña por consola. Que no se use en producción depende solo de un comentario.
- **Corrección propuesta:** abortar si `NODE_ENV === 'production'` o si `DATABASE_URL` no apunta a localhost, salvo con un flag explícito.
- **Resolución:**

---

## ⚪ Informativas / buenas prácticas

### - [ ] SEC-20 · Política de contraseñas mínima

`password.min(8)` sin más. Considerar rechazar contraseñas comunes (lista local, sin enviarlas a terceros) y un mínimo de 10 caracteres. En `loginPadreSchema`, `max(200)` no coincide con el límite de 72 bytes del registro (no es explotable, solo inconsistente).

- **Resolución:**

### - [ ] SEC-21 · `clearCookie` sin las mismas opciones que `cookie`

`padre.controller.ts:51,84,93`. Express 4 solo necesita que coincidan `path` y `domain`, así que hoy funciona. Si en el futuro se agrega `domain` o `path` a la cookie, el logout dejará de borrarla. Centralizar las opciones de cookie en una constante.

- **Resolución:**

### - [ ] SEC-22 · La puerta parental usa `Math.random` y sus multiplicaciones son de tabla conocida

`frontend/src/components/padre/PuertaParental.tsx`. Está documentado como filtro contra el acceso accidental y no como seguridad, y es correcto que así sea porque el login es la barrera real. Solo dejar constancia: un niño de 8 años que sepa las tablas del 4 al 9 la pasa. Validar con el producto si alcanza.

- **Resolución:**

### - [ ] SEC-23 · No hay auditoría de eventos de seguridad

No se registran (sin PII) los logins fallidos, las activaciones de perfil en un dispositivo, los registros ni los logouts. Sin eso no se puede investigar un incidente (STRIDE: R).

- **Resolución:**

### - [ ] SEC-24 · La CI no verifica la seguridad

No hay pipeline que corra `npm audit`, lint, tests ni `npm ci` con el lockfile congelado. Agregarlo antes del piloto con el Colegio Micelino. Considerar `npm audit signatures` y `--ignore-scripts` en la instalación de la CI.

- **Resolución:**

---

## Orden sugerido de trabajo

1. **SEC-01**, **SEC-03** y **SEC-02**: cambios chicos con mucho impacto, hacerlos antes de cualquier despliegue.
2. **SEC-10** (`npm audit fix` en el frontend y vitest 5 en el backend) y **SEC-12** (secreto de ejemplo).
3. **SEC-09** y **SEC-08**: cabeceras y CSP del frontend, imágenes de mismo origen.
4. **SEC-04** y **SEC-05**: revocación de sesiones, borrado y exportación de datos (confirmar el alcance con el producto antes).
5. El resto de los hallazgos, de severidad baja e informativa.

## Historial

| Fecha | Cambio |
|---|---|
| 2026-10-18 | Auditoría inicial sobre `f9da30d`. |
| 2026-10-18 | Resueltos SEC-01, SEC-02 y SEC-03; SEC-17 parcial. Backend: 58 tests pasan, typecheck y lint sin problemas. |
| 2026-10-18 | Resueltos SEC-10 (0 vulnerabilidades en `npm audit`; vitest 4.1.11) y SEC-12. Backend: 60 tests; e2e: 2/2 (móvil y escritorio). |
