# Especificación Funcional

## Aplicativo Web de Aprendizaje de Matemáticas para Niños

**Versión:** 1.0
**Estado:** Propuesta inicial
**Tipo de documento:** Especificación funcional del producto
**Público objetivo:** Niños de 3 a 12 años
**Plataformas objetivo:** Navegador web (escritorio, tablet y móvil) — aplicación web responsiva / PWA

---

# 1. Descripción del producto

El proyecto consiste en desarrollar una aplicación web educativa para el aprendizaje de matemáticas dirigida a niños de **3 a 12 años**, accesible desde cualquier navegador en computadoras, tablets y dispositivos móviles, sin necesidad de instalación.

La aplicación utilizará un enfoque de aprendizaje basado en:

* Lecciones cortas.
* Niveles progresivos.
* Ejercicios interactivos.
* Retroalimentación inmediata.
* Recompensas y gamificación.
* Evaluaciones periódicas.
* Seguimiento del progreso.
* Adaptación progresiva de la dificultad.

La experiencia de usuario estará inspirada en aplicaciones de aprendizaje gamificadas como Duolingo, pero el contenido, metodología y mecánicas estarán específicamente orientados al aprendizaje de matemáticas.

El objetivo no es simplemente presentar ejercicios matemáticos, sino construir una experiencia en la que el niño **aprenda, practique, reciba retroalimentación y avance progresivamente**.

---

# 2. Objetivos del aplicativo

## 2.1 Objetivo general

Crear una plataforma web que permita a niños de 3 a 12 años desarrollar progresivamente sus habilidades matemáticas mediante una experiencia educativa interactiva y gamificada, accesible desde cualquier navegador.

## 2.2 Objetivos específicos

* Desarrollar habilidades matemáticas de acuerdo con la edad y nivel del estudiante.
* Dividir el aprendizaje en unidades pequeñas y fáciles de completar.
* Mantener la motivación mediante recompensas y progresión.
* Proporcionar retroalimentación inmediata.
* Identificar las áreas en las que el estudiante presenta dificultades.
* Permitir repetir contenidos para reforzar conocimientos.
* Realizar pequeñas evaluaciones o simulacros.
* Permitir a padres/tutores consultar el progreso del niño.
* Permitir administrar y ampliar el contenido educativo sin necesidad de actualizar la aplicación.

---

# 3. Público objetivo

El aplicativo estará dirigido principalmente a niños entre **3 y 12 años**.

Para efectos de diseño y contenido, se propone dividir inicialmente a los estudiantes en tres grupos:

| Grupo      |      Edad | Características                                  |
| ---------- | --------: | ------------------------------------------------ |
| Inicial    |  3-5 años | Aprendizaje principalmente visual y auditivo     |
| Básico     |  6-8 años | Operaciones básicas y razonamiento matemático    |
| Intermedio | 9-12 años | Operaciones, problemas, geometría y razonamiento |

Esta clasificación será utilizada como referencia inicial. El sistema podrá posteriormente adaptar el contenido según el desempeño real del estudiante.

---

# 4. Concepto de aprendizaje

La aplicación estará organizada en una estructura jerárquica:

```text
CURSO
  │
  ├── UNIDAD
  │     │
  │     ├── NIVEL
  │     │     │
  │     │     ├── LECCIÓN
  │     │     │     ├── Pregunta
  │     │     │     ├── Pregunta
  │     │     │     └── Pregunta
  │     │     │
  │     │     └── Lección
  │     │
  │     └── Nivel
  │
  └── UNIDAD
```

La terminología podrá ajustarse durante el diseño, pero se recomienda mantener una jerarquía clara entre:

**Curso → Unidad → Nivel → Lección → Actividad/Pregunta**

---

# 5. Estructura de contenidos

## 5.1 Cursos

Representan una ruta completa de aprendizaje.

Ejemplo:

```text
Matemáticas Inicial 3-5 años
Matemáticas Básicas 6-8 años
Matemáticas 9-12 años
```

En una segunda etapa podrían incorporarse:

```text
Preparación escolar
Matemáticas primaria
Razonamiento matemático
Geometría
Fracciones
Preparación para exámenes
```

---

# 6. Unidades

Cada curso estará dividido en unidades temáticas.

Ejemplo para niños de 6-8 años:

```text
Unidad 1 - Números
Unidad 2 - Suma
Unidad 3 - Resta
Unidad 4 - Comparación de números
Unidad 5 - Multiplicación
Unidad 6 - División
Unidad 7 - Problemas matemáticos
Unidad 8 - Geometría básica
```

Cada unidad tendrá un objetivo de aprendizaje específico.

---

# 7. Niveles

Cada unidad estará formada por diferentes niveles.

Ejemplo:

```text
UNIDAD: SUMA

Nivel 1 - Sumamos hasta 5
Nivel 2 - Sumamos hasta 10
Nivel 3 - Sumamos hasta 20
Nivel 4 - Sumas con imágenes
Nivel 5 - Problemas sencillos
Nivel 6 - Desafío de suma
```

Los niveles serán progresivos.

El estudiante deberá cumplir determinados requisitos para desbloquear nuevos contenidos.

---

# 8. Lecciones

Cada nivel estará compuesto por una o varias lecciones.

Una lección deberá ser corta y estar diseñada para completarse en pocos minutos.

Ejemplo:

```text
Nivel: Sumas hasta 10

Lección 1
 ├── Explicación
 ├── Ejercicio 1
 ├── Ejercicio 2
 ├── Ejercicio 3
 ├── Ejercicio 4
 └── Ejercicio 5

Resultado
 └── Recompensa
```

La cantidad de ejercicios podrá variar dependiendo de la edad y dificultad.

---

# 9. Tipos de actividades

La aplicación deberá soportar diferentes tipos de interacción.

## 9.1 Selección múltiple

Ejemplo:

```text
¿Cuánto es 3 + 2?

[ 4 ]

[ 5 ]

[ 6 ]
```

El niño selecciona una respuesta.

---

## 9.2 Selección mediante imágenes

Especialmente importante para niños pequeños.

```text
¿Cuántas manzanas hay?

🍎 🍎 🍎 🍎

[3] [4] [5]
```

---

## 9.3 Arrastrar y soltar

Ejemplo:

```text
2 + 3 = ?

       5

       4

       6

Arrastra el número correcto.
```

El niño arrastra el resultado hacia la respuesta.

---

## 9.4 Completar respuesta

Ejemplo:

```text
5 + 4 = [  ]
```

El niño introduce o selecciona la respuesta.

---

## 9.5 Relacionar elementos

Ejemplo:

```text
Relaciona:

3 → ●●●
5 → ●●●●●
2 → ●●
```

---

## 9.6 Ordenar números

Ejemplo:

```text
Ordena de menor a mayor:

7   2   5   1

[1] [2] [5] [7]
```

---

## 9.7 Verdadero / falso

```text
3 + 4 = 7

[ VERDADERO ]

[ FALSO ]
```

---

## 9.8 Problemas matemáticos

Para niños mayores:

```text
Juan tiene 8 manzanas.
Regala 3.

¿Cuántas manzanas le quedan?

[ 5 ]
```

---

# 10. Sistema de preguntas

Las preguntas deberán almacenarse como contenido configurable.

Una pregunta deberá contener como mínimo:

```text
ID
Tipo
Enunciado
Nivel
Dificultad
Respuestas
Respuesta correcta
Explicación
Pista
Imagen
Audio
Orden
```

La aplicación no deberá depender de preguntas codificadas directamente dentro del aplicativo.

Esto permitirá agregar o modificar contenido posteriormente desde un sistema administrativo.

---

# 11. Generación de preguntas

Se contemplan dos tipos de preguntas.

## 11.1 Preguntas predefinidas

Son creadas previamente por autores o docentes.

Ejemplo:

```text
¿Cuánto es 4 + 3?
```

---

## 11.2 Preguntas generadas dinámicamente

Para determinados contenidos, el sistema podrá generar automáticamente nuevas preguntas.

Por ejemplo:

```text
Pregunta 1:
3 + 4 = ?

Pregunta 2:
7 + 2 = ?

Pregunta 3:
5 + 6 = ?
```

La estructura matemática será la misma, pero los valores podrán cambiar.

Esto permitirá generar muchas variaciones de un mismo ejercicio.

---

# 12. Respuestas

La aplicación deberá validar la respuesta inmediatamente después de la interacción del estudiante.

## Respuesta correcta

El sistema deberá:

* Mostrar retroalimentación positiva.
* Registrar la respuesta.
* Actualizar el progreso.
* Otorgar puntos/recompensa.
* Permitir continuar.

Ejemplo:

```text
🎉 ¡Muy bien!

3 + 2 = 5

+10 puntos
```

---

## Respuesta incorrecta

El sistema deberá:

* Indicar que la respuesta no es correcta.
* Explicar o mostrar una pista.
* Permitir continuar según la configuración de la actividad.
* Registrar el error.

Ejemplo:

```text
Casi...

Mira los grupos:

🍎🍎🍎 + 🍎🍎

Son 5.

Inténtalo nuevamente.
```

La aplicación deberá evitar generar una experiencia negativa ante los errores.

---

# 13. Sistema de intentos

Las actividades podrán tener diferentes configuraciones.

Ejemplo:

```text
allow_retry = true
max_attempts = 3
show_hint_after = 1
```

Esto permitirá definir:

* Si se puede intentar nuevamente.
* Número máximo de intentos.
* Cuándo mostrar una pista.
* Si una respuesta incorrecta afecta la puntuación.

---

# 14. Sistema de dificultad

Cada actividad podrá tener una dificultad.

Propuesta:

```text
1 - Muy fácil
2 - Fácil
3 - Normal
4 - Difícil
5 - Desafío
```

La dificultad podrá utilizarse posteriormente para crear un sistema de aprendizaje adaptativo.

---

# 15. Sistema de progreso

El sistema deberá registrar el progreso individual de cada estudiante.

Se deberá almacenar información como:

```text
Curso actual
Unidad actual
Nivel actual
Lecciones completadas
Preguntas respondidas
Respuestas correctas
Respuestas incorrectas
Puntuación
Tiempo utilizado
Intentos
Errores frecuentes
```

---

# 16. Desbloqueo de contenidos

Los niveles estarán inicialmente bloqueados.

Ejemplo:

```text
🔓 Nivel 1
🔓 Nivel 2
🔒 Nivel 3
🔒 Nivel 4
🔒 Nivel 5
```

Al completar un nivel:

```text
Nivel 2 completado

⭐ ⭐ ⭐

Nuevo nivel desbloqueado:

🔓 Nivel 3
```

Los criterios de desbloqueo deberán ser configurables.

Ejemplo:

```text
Completar nivel anterior
+
Obtener mínimo 70%
```

---

# 17. Sistema de estrellas

Cada nivel podrá otorgar entre 1 y 3 estrellas.

Ejemplo:

```text
⭐ 60-69%
⭐⭐ 70-89%
⭐⭐⭐ 90-100%
```

Estos valores son configurables y deberán poder modificarse sin actualizar la aplicación.

Las estrellas representarán progreso y dominio, pero no deberán impedir necesariamente que el niño continúe aprendiendo.

---

# 18. Sistema de puntos

El estudiante podrá recibir puntos por:

* Responder correctamente.
* Completar lecciones.
* Completar niveles.
* Completar simulacros.
* Mantener una racha.
* Conseguir determinados logros.

Ejemplo:

```text
Respuesta correcta       +10 XP
Completar lección        +50 XP
Completar nivel          +100 XP
Simulacro                +200 XP
```

Los valores serán configurables.

---

# 19. Sistema de recompensas

Las recompensas podrán incluir:

* Puntos.
* Estrellas.
* Monedas virtuales.
* Insignias.
* Elementos para personalizar el avatar.
* Nuevos escenarios.
* Animaciones especiales.

Ejemplo:

```text
🎉 ¡Nivel completado!

Has ganado:

⭐ 3 estrellas
💎 50 monedas
🏆 Nueva insignia
```

---

# 20. Sistema de rachas

La aplicación podrá registrar la cantidad de días consecutivos en los que el estudiante utiliza la aplicación.

Ejemplo:

```text
🔥 Racha actual

5 días
```

La racha deberá utilizarse como elemento motivacional y no como mecanismo obligatorio para avanzar.

---

# 21. Logros

El sistema deberá permitir definir logros.

Ejemplos:

```text
🏆 Primer nivel
Completa tu primer nivel.

🏆 Matemático
Responde 50 preguntas correctamente.

🏆 Constancia
Estudia durante 7 días.

🏆 Experto en sumas
Completa todos los niveles de suma.
```

Los logros deberán ser configurables.

---

# 22. Mapa de aprendizaje

La pantalla principal del estudiante mostrará visualmente el recorrido de aprendizaje.

Ejemplo:

```text
          🏆
           │
       🔓 Nivel 5
           │
       🔓 Nivel 4
           │
       ⭐ Nivel 3
           │
       ⭐ Nivel 2
           │
       ⭐ Nivel 1
           │
          🏠
```

El mapa podrá utilizar diferentes mundos o escenarios.

Ejemplo:

```text
🌳 Mundo de los números
🏰 Mundo de las operaciones
🚀 Mundo de la multiplicación
🌌 Mundo de la geometría
```

---

# 23. Simulacros

Los simulacros serán pequeñas evaluaciones que permitirán medir el dominio de determinados contenidos.

Ejemplo:

```text
SIMULACRO

10 preguntas
Tiempo: 5 minutos

Temas:
✓ Suma
✓ Resta
✓ Comparación
```

El simulacro podrá seleccionar preguntas de diferentes niveles.

---

# 24. Resultado del simulacro

Al terminar:

```text
🎉 Simulacro terminado

Puntaje: 85%

Correctas: 17
Incorrectas: 3

Tiempo: 04:21

Temas a reforzar:
• Resta
• Problemas matemáticos
```

El estudiante podrá volver a practicar los temas que presentaron mayor dificultad.

---

# 25. Modo práctica

Además del recorrido principal, se podrá incluir un modo de práctica.

El estudiante podrá elegir:

```text
Practicar:

➕ Sumas
➖ Restas
✖️ Multiplicación
➗ División
🔺 Geometría
🧠 Problemas
```

Este modo no necesariamente afectará el desbloqueo de niveles.

---

# 26. Reforzamiento

El sistema deberá identificar preguntas o temas donde el estudiante presenta dificultades.

Ejemplo:

```text
Hemos notado que la resta
puede ser un poco difícil.

¿Quieres practicar?

[ PRACTICAR ]
```

Posteriormente, el sistema podrá generar automáticamente sesiones de reforzamiento.

---

# 27. Adaptación de dificultad

Como evolución del producto, la aplicación podrá adaptar las actividades según el desempeño.

Ejemplo:

```text
Si el estudiante responde correctamente
varias preguntas:

Dificultad:
Fácil → Normal
```

Si presenta errores:

```text
Difícil → Normal
```

El objetivo será mantener las actividades dentro de un nivel adecuado para el estudiante.

---

# 28. Perfil del estudiante

El perfil mostrará:

```text
Avatar
Nombre
Nivel
XP
Estrellas
Monedas
Racha
Logros
Progreso
```

Ejemplo:

```text
👧 Sofía

Nivel 12
⭐ 36 estrellas
💎 420 monedas
🔥 7 días

Progreso
████████░░ 80%
```

---

# 29. Personalización del avatar

El estudiante podrá seleccionar un avatar.

Dependiendo del diseño:

```text
Personaje
Ropa
Color
Accesorios
Fondos
Mascotas
```

Algunos elementos podrán desbloquearse mediante recompensas.

---

# 30. Audio y accesibilidad

Especialmente importante para niños de 3 a 5 años.

Las preguntas podrán incorporar:

* Narración de instrucciones.
* Sonidos de respuesta correcta.
* Sonidos de error.
* Animaciones.
* Elementos visuales.
* Botón para repetir instrucciones.

Ejemplo:

```text
🔊 ¿Cuántos objetos hay?

🍎 🍎 🍎

[ 2 ] [ 3 ] [ 4 ]
```

El niño podrá escuchar la pregunta en lugar de depender exclusivamente de la lectura.

---

# 31. Sesiones de aprendizaje

La aplicación deberá incentivar sesiones cortas.

Ejemplo:

```text
Sesión recomendada

⏱ 5-10 minutos

[ COMENZAR ]
```

Una sesión podrá contener:

```text
1. Actividad
2. Actividad
3. Actividad
4. Recompensa
```

Esto permitirá que el aprendizaje sea progresivo sin exigir sesiones demasiado largas.

---

# 32. Menú principal

El menú principal podrá contener:

```text
🏠 Inicio
🗺️ Aprender
🎯 Practicar
📝 Simulacros
🏆 Logros
👤 Perfil
⚙️ Configuración
```

La navegación final será definida durante el diseño UX/UI.

---

# 33. Perfil del padre/tutor

Se deberá contemplar un espacio protegido para padres/tutores.

El tutor podrá consultar:

* Progreso general.
* Tiempo de aprendizaje.
* Niveles completados.
* Resultados.
* Temas dominados.
* Temas que requieren refuerzo.
* Actividad reciente.

Ejemplo:

```text
Progreso de Sofía

Matemáticas: 72%

Fortalezas:
✓ Conteo
✓ Suma

Para reforzar:
• Resta
• Problemas matemáticos
```

---

# 34. Control parental

La sección de padres deberá estar separada de la experiencia infantil.

Podrá incluir:

```text
Configuración de sesiones
Notificaciones
Gestión del perfil
Privacidad
Control de audio
Gestión de cuenta
```

La entrada a esta sección deberá contar con un mecanismo que evite que un niño acceda accidentalmente.

---

# 35. Sistema administrativo

El producto deberá contar con un panel administrativo independiente de la aplicación web del estudiante, accesible también desde el navegador.

Este panel permitirá administrar el contenido.

---

# 36. Gestión de cursos

El administrador podrá:

* Crear cursos.
* Editar cursos.
* Activar/desactivar cursos.
* Definir edades recomendadas.
* Ordenar cursos.

Ejemplo:

```text
Curso
Nombre
Descripción
Edad mínima
Edad máxima
Estado
Orden
```

---

# 37. Gestión de unidades

El administrador podrá:

* Crear unidades.
* Modificar unidades.
* Ordenar unidades.
* Activar/desactivar unidades.

---

# 38. Gestión de niveles

El administrador podrá:

* Crear niveles.
* Editar niveles.
* Ordenar niveles.
* Definir dificultad.
* Definir requisitos.
* Asociar lecciones.
* Publicar/despublicar niveles.

---

# 39. Gestión de preguntas

El administrador podrá crear diferentes tipos de preguntas.

Ejemplo:

```text
Tipo:
[Selección múltiple]

Pregunta:
¿Cuánto es 3 + 2?

Opciones:
4
5
6

Respuesta:
5

Pista:
Cuenta los objetos.

Dificultad:
Fácil

Estado:
Publicado
```

---

# 40. Gestión multimedia

Las preguntas podrán asociarse con:

```text
Imagen
Audio
Animación
Video
```

El sistema administrativo permitirá cargar y administrar estos recursos.

---

# 41. Publicación de contenido

El contenido deberá manejar estados.

```text
BORRADOR
    ↓
EN REVISIÓN
    ↓
APROBADO
    ↓
PUBLICADO
```

Esto permitirá que el contenido sea revisado antes de aparecer en la aplicación.

---

# 42. Roles administrativos

Se recomienda contemplar inicialmente:

```text
ADMINISTRADOR
    │
    ├── Gestión completa
    │
AUTOR DE CONTENIDO
    │
    ├── Crear preguntas
    ├── Crear niveles
    └── Editar contenido
```

Posteriormente podrían incorporarse:

```text
REVISOR PEDAGÓGICO
DOCENTE
ANALISTA
```

---

# 43. Estadísticas

El sistema deberá registrar información que permita evaluar el funcionamiento del producto.

Indicadores posibles:

```text
Usuarios activos
Lecciones iniciadas
Lecciones completadas
Preguntas respondidas
Porcentaje de respuestas correctas
Tiempo promedio
Tasa de abandono
Niveles completados
Simulacros realizados
```

---

# 44. Analítica educativa

Además de medir el uso de la aplicación, se deberá analizar el aprendizaje.

Ejemplo:

```text
Tema: Sumas hasta 20

100 estudiantes

✓ 82% responde correctamente
✗ 18% presenta dificultades
```

Esto permitirá detectar contenidos que necesitan ser revisados.

---

# 45. Notificaciones

La aplicación podrá enviar notificaciones, principalmente bajo control del tutor.

Ejemplos:

```text
🌟 ¡Es hora de aprender!

Sofía lleva 3 días practicando.
```

```text
🏆 ¡Nuevo logro!

Completaste 10 niveles.
```

Las notificaciones deberán ser configurables.

---

# 46. Funcionamiento sin conexión

Como funcionalidad futura, la aplicación web podrá instalarse como Progressive Web App (PWA) y utilizar un service worker para cachear determinados contenidos y permitir su uso con conectividad limitada o intermitente.

Por ejemplo:

```text
Guardar Unidad 1 para uso sin conexión

✓ Contenido
✓ Imágenes
✓ Audio
✓ Preguntas
```

Cuando vuelva la conexión:

```text
Progreso local
      ↓
Sincronización
      ↓
Servidor
```

---

# 47. Flujo principal del estudiante

```text
                    ┌──────────────┐
                    │    INICIO    │
                    └──────┬───────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Seleccionar perfil│
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  MAPA / INICIO   │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          Aprender      Practicar     Simulacro
             │             │             │
             ▼             ▼             ▼
          Nivel         Tema          Evaluación
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                      Preguntas
                           │
                           ▼
                     Respuesta
                           │
                  ┌────────┴────────┐
                  │                 │
               Correcta          Incorrecta
                  │                 │
                  ▼                 ▼
              Recompensa        Pista /
                  │             Reintento
                  └──────┬──────────┘
                         ▼
                    Resultado
                         │
                         ▼
                  Actualizar progreso
                         │
                         ▼
                 Desbloquear contenido
```

---

# 48. Flujo de aprendizaje

```text
Curso
  ↓
Unidad
  ↓
Nivel
  ↓
Lección
  ↓
Actividad
  ↓
Respuesta
  ↓
Retroalimentación
  ↓
Siguiente actividad
  ↓
Resultado
  ↓
Recompensa
  ↓
Progreso
  ↓
Nuevo nivel
```

---

# 49. Reglas funcionales principales

## RF-001 — Creación de perfil

El sistema deberá permitir crear un perfil de estudiante.

## RF-002 — Selección de curso

El sistema deberá asignar o permitir seleccionar una ruta de aprendizaje apropiada.

## RF-003 — Desbloqueo

El sistema deberá controlar qué niveles están disponibles para cada estudiante.

## RF-004 — Ejecución de lección

El sistema deberá presentar las actividades de una lección en el orden definido.

## RF-005 — Validación

El sistema deberá validar las respuestas.

## RF-006 — Retroalimentación

El sistema deberá mostrar retroalimentación después de cada respuesta.

## RF-007 — Progreso

El sistema deberá registrar el progreso del estudiante.

## RF-008 — Recompensas

El sistema deberá calcular y otorgar recompensas según las reglas configuradas.

## RF-009 — Simulacros

El sistema deberá permitir realizar evaluaciones configuradas.

## RF-010 — Reforzamiento

El sistema deberá permitir practicar nuevamente contenidos.

## RF-011 — Administración

El sistema deberá permitir gestionar el contenido educativo.

## RF-012 — Estadísticas

El sistema deberá generar métricas de aprendizaje y uso.

---

# 50. Reglas de negocio iniciales

Las reglas definitivas deberán ser definidas junto con el equipo pedagógico.

Como propuesta inicial:

### RB-001

Un nivel estará bloqueado inicialmente hasta cumplir los requisitos configurados.

### RB-002

Completar una lección registrará el progreso del estudiante.

### RB-003

Una respuesta correcta generará puntos.

### RB-004

Una respuesta incorrecta será registrada para análisis posterior.

### RB-005

Las preguntas podrán tener diferentes niveles de dificultad.

### RB-006

Las recompensas deberán poder configurarse desde el backend.

### RB-007

Los simulacros podrán utilizar preguntas de diferentes niveles.

### RB-008

Los resultados deberán quedar asociados al estudiante.

### RB-009

El contenido educativo deberá poder actualizarse sin publicar una nueva versión de la aplicación.

### RB-010

El progreso deberá sincronizarse con el servidor cuando exista conectividad.

---

# 51. Experiencia esperada

La experiencia del niño deberá cumplir los siguientes principios:

### Simple

El niño deberá poder entender qué debe hacer sin explicaciones complejas.

### Visual

Se deberá priorizar el uso de imágenes, animaciones y elementos visuales.

### Interactiva

El estudiante deberá participar activamente.

### Progresiva

Las actividades deberán aumentar gradualmente en dificultad.

### Motivadora

Los avances deberán ser visibles y recompensados.

### Tolerante al error

El error deberá utilizarse como una oportunidad de aprendizaje.

### Breve

Las actividades deberán poder completarse en sesiones cortas.

---

# 52. Arquitectura funcional del producto

A nivel funcional, el producto estará compuesto por:

```text
                    APLICACIÓN EDUCATIVA
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   EXPERIENCIA         APRENDIZAJE        GAMIFICACIÓN
   DEL USUARIO             │                  │
        │                  │                  │
        │            ┌─────┼─────┐            │
        │            │     │     │            │
        │            ▼     ▼     ▼            ▼
        │         Cursos Niveles Preguntas  Recompensas
        │                                      │
        ▼                                      ▼
   Perfil / Mapa                         Logros / XP
        │
        ▼
   Progreso
        │
        ▼
   Padre/Tutor


                 ┌─────────────────────┐
                 │ PANEL ADMINISTRATIVO│
                 └──────────┬──────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
       Contenido        Usuarios         Analítica
           │
           ├── Cursos
           ├── Unidades
           ├── Niveles
           ├── Lecciones
           ├── Preguntas
           └── Multimedia
```

---

# 53. Alcance del MVP

Para una primera versión se recomienda limitar el producto a las funcionalidades esenciales.

## Incluido en MVP

* Creación de perfil.
* Selección de edad/ruta.
* Mapa de aprendizaje.
* Cursos.
* Unidades.
* Niveles.
* Lecciones.
* Preguntas.
* Selección múltiple.
* Preguntas visuales.
* Completar respuestas.
* Validación de respuestas.
* Retroalimentación.
* Progreso.
* Estrellas.
* Puntos.
* Desbloqueo de niveles.
* Simulacros básicos.
* Perfil.
* Panel administrativo.
* Gestión de preguntas.
* Gestión de niveles.
* Estadísticas básicas.

## Fuera del MVP inicial

* Inteligencia artificial adaptativa.
* Generación avanzada de preguntas mediante IA.
* Multijugador.
* Ranking competitivo.
* Integración con colegios.
* Múltiples materias.
* Marketplace.
* Sistema avanzado de suscripciones.
* Contenido offline completo.
* Personalización avanzada mediante machine learning.

Estas funcionalidades podrán incorporarse en versiones posteriores.

---

# 54. Evolución futura

La aplicación podrá evolucionar hacia una plataforma educativa más completa.

```text
VERSIÓN 1
MVP
 │
 ├── Niveles
 ├── Preguntas
 ├── Progreso
 └── Gamificación
        │
        ▼
VERSIÓN 2
Aprendizaje adaptativo
 │
 ├── Dificultad dinámica
 ├── Reforzamiento
 └── Recomendaciones
        │
        ▼
VERSIÓN 3
Inteligencia educativa
 │
 ├── Generación de ejercicios
 ├── Personalización
 └── Análisis avanzado
        │
        ▼
VERSIÓN 4
Plataforma educativa
 │
 ├── Padres
 ├── Docentes
 ├── Colegios
 └── Nuevas materias
```

---

# 55. Indicadores de éxito del producto

Para evaluar el funcionamiento del aplicativo se podrán utilizar indicadores como:

### Uso

* Usuarios activos.
* Sesiones por usuario.
* Duración promedio de sesión.
* Frecuencia de uso.

### Aprendizaje

* Porcentaje de respuestas correctas.
* Progreso por unidad.
* Resultados de simulacros.
* Reducción de errores por tema.

### Retención

* Usuarios que regresan al día siguiente.
* Usuarios activos semanalmente.
* Continuidad de las rutas de aprendizaje.

### Contenido

* Niveles completados.
* Preguntas con mayor cantidad de errores.
* Preguntas con mayor tasa de abandono.

---

# 56. Consideraciones importantes

Debido a que el aplicativo está dirigido a menores de edad, la solución deberá considerar desde el inicio:

* Protección de datos de menores.
* Consentimiento y participación del padre/tutor cuando corresponda.
* Minimización de datos personales.
* Controles parentales.
* Seguridad de cuentas.
* Gestión adecuada de contenido.
* Diseño apropiado para cada grupo etario.
* Ausencia de mecanismos que incentiven comportamientos perjudiciales.
* Revisión pedagógica del contenido.

Los requisitos legales concretos deberán analizarse según los países donde se publique el aplicativo.

---

# 57. Principio fundamental del producto

La aplicación deberá seguir el siguiente ciclo:

```text
                 ┌───────────────┐
                 │    APRENDER   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   PRACTICAR   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    EVALUAR    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    ANALIZAR   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   REFORZAR    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    AVANZAR    │
                 └───────┬───────┘
                         │
                         └──────────► APRENDER
```

El objetivo final del producto será convertir este ciclo en una experiencia sencilla y atractiva para el niño, mientras que el sistema registra suficiente información para comprender su progreso y ofrecerle contenidos adecuados.
