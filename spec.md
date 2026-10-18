# Spec — App Web de Matemáticas Gamificada para Niños (v1)

> Basado en la plantilla Spec-First para Claude (`plantilla spec`), completado con el
> contenido de [`funcionalidad.md`](./funcionalidad.md) y acotado al alcance de v1
> definido en [`PRD.md`](./PRD.md). Donde `funcionalidad.md` describe algo que
> `PRD.md` deja fuera de esta versión, se marca explícitamente como **Fuera de v1**
> y no debe implementarse todavía.

---

## SECCIÓN 1 — Visión del producto

App web educativa de matemáticas gamificada para niños de **6 a 8 años** (franja
Básico), con enfoque en operaciones básicas y razonamiento matemático. Está inspirada
en la experiencia de Duolingo pero orientada exclusivamente a matemáticas: lecciones
cortas, niveles progresivos, retroalimentación inmediata y recompensas simples, para
que padres y colegios tengan una alternativa consistente a los videos sueltos y
tutores privados. Piloto inicial: **Colegio Micelino**.

---

## SECCIÓN 2 — Usuarios y casos de uso

### Niño (6-8 años) — usuario principal

- Elige un nivel disponible (desbloqueado) en el mapa de aprendizaje y comienza una lección.
- Responde preguntas de selección múltiple o selección mediante imágenes y recibe
  retroalimentación inmediata (correcto/incorrecto + pista).
- Completa un simulacro periódico para medir su dominio de varios temas a la vez.

Ya lee con más fluidez que la franja Inicial (3-5 años), por lo que v1 **no depende
críticamente de narración de audio** (esa necesidad se evalúa junto con la franja 3-5
en una versión futura).

### Padre/tutor

- Consulta el progreso general del niño (niveles completados, estrellas, resultados
  de simulacros).
- Accede a una sección separada de la experiencia del niño, protegida frente a acceso
  accidental.
- (v1) Solo consulta — no administra contenido ni configura recompensas.

### Colegio/docente (piloto)

- Rol de consulta/decisión para el piloto con el Colegio Micelino: seguimiento del uso
  y resultados agregados durante el mes de piloto.
- **Fuera de v1:** integración formal con sistemas del colegio (notas, SSO); durante
  el piloto la coordinación es manual.

### Equipo del proyecto (no es un rol dentro de la app)

- Carga el contenido (cursos, unidades, niveles, lecciones, preguntas de la franja
  6-8 años) directamente en la base de datos antes del piloto.
- **Fuera de v1:** panel administrativo — no hay una interfaz de gestión de contenido.

---

## SECCIÓN 3 — Funcionalidades

### Módulo de contenido (Curso → Unidad → Nivel → Lección → Pregunta)

- El sistema organiza el aprendizaje en una jerarquía **Curso → Unidad → Nivel →
  Lección → Pregunta** (`funcionalidad.md` §4-§8).
- v1 contiene un único curso, el de la franja Básico (6-8 años), con unidades
  temáticas (ej. Números, Suma, Resta, Comparación, Multiplicación, División,
  Problemas, Geometría básica — `funcionalidad.md` §6).
- Cada unidad tiene niveles progresivos; cada nivel tiene una o varias lecciones
  cortas (pocos minutos, `funcionalidad.md` §7-§8).
- El contenido (cursos, unidades, niveles, lecciones, preguntas) se carga
  **directamente a la base de datos**, sin panel administrativo (PRD, alcance).
  El contenido debe poder actualizarse sin publicar una nueva versión de la
  aplicación (CLAUDE.md, "Consideraciones no negociables").
- **Fuera de v1:** múltiples cursos por franja etaria, gestión de contenido vía panel
  administrativo (`funcionalidad.md` §35-§42).

### Módulo de preguntas y actividades

- El sistema soporta dos tipos de actividad en v1:
  - **Selección múltiple** (`funcionalidad.md` §9.1).
  - **Selección mediante imágenes** (`funcionalidad.md` §9.2).
- Cada pregunta se almacena como contenido configurable con, como mínimo: ID, tipo,
  enunciado, nivel, dificultad, respuestas, respuesta correcta, explicación, pista,
  imagen y orden (`funcionalidad.md` §10, campo `audio` no es crítico para v1 dado
  que la franja 6-8 no depende de narración).
- Las preguntas de v1 son **predefinidas** (`funcionalidad.md` §11.1).
- **Fuera de v1:** arrastrar y soltar, completar respuesta libre, relacionar
  elementos, ordenar números, verdadero/falso, problemas matemáticos como tipo de
  actividad aparte (`funcionalidad.md` §9.3-§9.8); preguntas generadas dinámicamente
  (`funcionalidad.md` §11.2); adaptación de dificultad por IA (`funcionalidad.md`
  §27).

### Módulo de validación y retroalimentación

- El sistema valida la respuesta inmediatamente después de la interacción
  (`funcionalidad.md` §12).
- Respuesta correcta: retroalimentación positiva, se registra la respuesta, se
  actualiza el progreso, se otorgan puntos, se permite continuar.
- Respuesta incorrecta: se indica que no es correcta, se muestra pista/explicación,
  se registra el error; según configuración de intentos se permite reintentar.
- Si el niño agota los intentos permitidos sin acertar, el sistema muestra la
  respuesta correcta y exige marcarla para poder continuar (PRD, casos borde).
- Configuración de intentos por actividad: posibilidad de reintentar, número máximo
  de intentos, cuándo mostrar pista (`funcionalidad.md` §13).

### Módulo de progreso y desbloqueo

- El sistema registra el progreso individual del estudiante: curso/unidad/nivel
  actual, lecciones completadas, preguntas respondidas, aciertos/errores, puntuación,
  intentos (`funcionalidad.md` §15).
- Los niveles están inicialmente bloqueados y se desbloquean al cumplir los
  requisitos configurados (ej. completar el nivel anterior con un mínimo de acierto,
  `funcionalidad.md` §16).
- Si el niño abandona una lección a la mitad, el progreso parcial no se guarda: la
  lección se reinicia desde el principio al volver a entrar (PRD, casos borde).
- Un mismo niño puede acceder desde el colegio o desde casa compartiendo el mismo
  perfil y progreso, sin duplicarlo (PRD, casos borde).

### Módulo de gamificación básica

- Sistema de **estrellas**: cada nivel completado otorga entre 1 y 3 estrellas según
  el porcentaje de acierto, con umbrales configurables (`funcionalidad.md` §17).
- Sistema de **puntos**: el estudiante recibe puntos por responder correctamente,
  completar lecciones, completar niveles y completar simulacros, con valores
  configurables (`funcionalidad.md` §18, acotado a estos disparadores).
- Mapa de aprendizaje: pantalla principal que muestra visualmente el recorrido de
  niveles bloqueados/desbloqueados/completados (`funcionalidad.md` §22).
- **Fuera de v1:** monedas virtuales, insignias, personalización de avatar,
  escenarios/mundos múltiples, animaciones especiales de recompensa
  (`funcionalidad.md` §19, §29), rachas (`funcionalidad.md` §20), logros
  (`funcionalidad.md` §21), modo práctica libre y reforzamiento automático
  (`funcionalidad.md` §25-§26).

### Módulo de simulacros

- El sistema permite realizar simulacros: evaluaciones cortas con un número fijo de
  preguntas y límite de tiempo, que pueden tomar preguntas de distintos niveles
  dentro de los temas cubiertos (`funcionalidad.md` §23).
- Al finalizar, el sistema muestra un resultado: puntaje, correctas/incorrectas,
  tiempo utilizado y temas a reforzar (`funcionalidad.md` §24).

### Módulo de perfil y control parental

- Perfil del estudiante: nombre, nivel, estrellas, puntos, progreso
  (`funcionalidad.md` §28, acotado — sin avatar personalizable ni monedas en v1).
- Perfil de padre/tutor: consulta de progreso general, niveles completados,
  resultados de simulacros, temas dominados y temas a reforzar
  (`funcionalidad.md` §33, acotado a consulta — sin gestión de notificaciones ni
  configuración avanzada en v1).
- **Registro abierto:** cualquier adulto puede crear una cuenta de padre/tutor con
  correo y contraseña, declarando ser mayor de edad y padre/madre/tutor legal (la
  fecha de la declaración se guarda). Desde su cuenta crea los perfiles de sus hijos,
  de los que solo se pide un nombre o apodo (minimización de datos). Límites contra
  abuso: registros por IP por hora y un máximo de perfiles por cuenta.
- La sección de padres/tutores está **separada** de la experiencia del niño, con un
  mecanismo que evite que el niño acceda accidentalmente a configuración o datos del
  padre (`funcionalidad.md` §34; CLAUDE.md, "Consideraciones no negociables").
- **Fuera de v1:** gestión de notificaciones, control de audio, gestión de cuenta
  avanzada dentro del panel de padres (`funcionalidad.md` §34, salvo lo mínimo
  necesario para la separación de secciones).

---

## SECCIÓN 4 — Flujos de usuario

### Flujo 1 — Completar una lección (happy path)

1. El niño entra al mapa de aprendizaje y ve los niveles disponibles.
2. Selecciona un nivel desbloqueado y comienza una lección.
3. El sistema presenta las preguntas de la lección en el orden definido (selección
   múltiple o selección por imágenes).
4. El niño responde cada pregunta; el sistema valida y muestra retroalimentación
   inmediata.
5. Al completar todas las preguntas, el sistema calcula el resultado, otorga
   estrellas/puntos, actualiza el progreso y evalúa si se desbloquea el siguiente
   nivel.

**Casos de error / borde:**

- Respuesta incorrecta: el sistema muestra pista/explicación y permite reintentar
  según la configuración de intentos de la actividad.
- Intentos agotados sin acertar: el sistema muestra la respuesta correcta y exige
  marcarla para continuar.
- El niño cierra la pestaña o pierde conexión a mitad de la lección: el progreso
  parcial no se guarda; al reingresar, la lección se reinicia desde el principio.

### Flujo 2 — Responder una pregunta

1. El sistema presenta el enunciado y las opciones (texto o imágenes, según el tipo
   de actividad).
2. El niño selecciona una opción.
3. El sistema valida contra la respuesta correcta almacenada en el contenido.
4. Si es correcta: retroalimentación positiva + puntos, avanza a la siguiente
   pregunta.
5. Si es incorrecta: retroalimentación de error + pista, según configuración de
   intentos se permite reintentar o se avanza mostrando la respuesta correcta.

### Flujo 3 — Realizar un simulacro

1. El niño accede a la sección de simulacros.
2. El sistema arma el simulacro con preguntas de distintos niveles/temas ya vistos.
3. El niño responde dentro del tiempo asignado.
4. Al terminar (o agotar el tiempo), el sistema calcula el puntaje y muestra
   correctas/incorrectas, tiempo utilizado y temas a reforzar.

**Error/borde:** si el niño no completa el simulacro a tiempo, el sistema lo cierra
y califica solo lo respondido hasta ese momento.

### Flujo 4 — Padre/tutor consulta el progreso

1. El padre/tutor accede a la sección de padres, separada de la experiencia del
   niño, mediante un mecanismo que evite el acceso accidental de un niño.
2. El sistema muestra el progreso general del niño: niveles completados, estrellas,
   resultados de simulacros, temas fuertes y temas a reforzar.
3. El padre/tutor no puede desde aquí modificar contenido ni configuración de
   gamificación (eso no está en el alcance de v1).

---

## SECCIÓN 5 — Arquitectura

Definida en `CLAUDE.md` como decisión ya tomada para el proyecto:

- **Frontend:** React + Vite. Responsivo (desktop, tablet, móvil), sin instalación.
- **Backend:** Node.js + Express, como proyecto separado del frontend (no monorepo
  con framework full-stack).
- **Base de datos:** PostgreSQL. Almacena la jerarquía Curso → Unidad → Nivel →
  Lección → Pregunta, el progreso del estudiante y los datos del perfil de
  padre/tutor.
- **Autenticación:** dos sesiones separadas, ambas en cookie httpOnly con JWT de
  audiencia propia (un token de una nunca vale como el otro):
  - **Padre/tutor:** email + contraseña.
  - **Niño:** el niño no tiene credenciales. Un padre/tutor autenticado elige el
    perfil del hijo en el dispositivo ("Usar en este dispositivo"); eso deja una
    sesión de niño de larga duración y cierra la del padre. El progreso se registra
    siempre a nombre del perfil de esa sesión, nunca de un id enviado por el
    cliente. El mismo perfil se activa en cada dispositivo (casa, colegio), así que
    el progreso se comparte sin duplicarse.
- **Contenido:** cargado directamente a la base de datos (sin panel administrativo
  ni API de gestión en v1); el contenido debe poder actualizarse sin desplegar una
  nueva versión del frontend.
- **Hosting:** a decidir.

---

## SECCIÓN 6 — Requisitos no funcionales

- **Público menor de edad:** cualquier funcionalidad que toque datos personales,
  cuentas o contenido debe minimizar los datos personales de los niños que se
  recolectan y almacenan (CLAUDE.md).
- **Separación niño/padre:** la experiencia del niño y la sección de padres/control
  parental deben estar claramente separadas, evitando que un niño acceda
  accidentalmente a configuración o datos del padre (CLAUDE.md;
  `funcionalidad.md` §34).
- **Actualización de contenido:** el contenido educativo debe poder actualizarse sin
  depender de una nueva versión de la aplicación, aun sin panel administrativo en v1
  (vive en PostgreSQL, no hardcodeado en el frontend).
- **Plataforma:** web responsiva (desktop, tablet, móvil), sin instalación. Sin modo
  offline/PWA en v1.
- **Alcance etario:** una sola franja en v1 (6-8 años, Básico); no se soportan las
  franjas 3-5 ni 9-12 años todavía.
- **Continuidad de sesión:** un mismo niño debe poder acceder desde el colegio y
  desde casa compartiendo perfil y progreso, sin duplicación de datos.
- **Tolerancia al error pedagógica:** el diseño de retroalimentación debe evitar
  generar una experiencia negativa ante los errores del niño (`funcionalidad.md`
  §12, §51).
