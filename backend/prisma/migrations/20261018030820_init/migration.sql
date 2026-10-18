-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('SELECCION_MULTIPLE', 'SELECCION_IMAGEN');

-- CreateTable
CREATE TABLE "padres_tutores" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "padres_tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "padreTutorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "franjaEtaria" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveles" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "dificultad" INTEGER NOT NULL DEFAULT 1,
    "porcentajeDesbloqueo" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "niveles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecciones" (
    "id" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "leccionId" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "pista" TEXT,
    "explicacion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "texto" TEXT,
    "imagenUrl" TEXT,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresos" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "estrellas" INTEGER NOT NULL DEFAULT 0,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_registro" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL,
    "numeroIntento" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulacros" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracionSegundos" INTEGER NOT NULL,
    "unidadesIds" TEXT[],

    CONSTRAINT "simulacros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulacro_resultados" (
    "id" TEXT NOT NULL,
    "simulacroId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "puntajePorcentaje" INTEGER NOT NULL,
    "correctas" INTEGER NOT NULL,
    "incorrectas" INTEGER NOT NULL,
    "tiempoUtilizadoSegundos" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulacro_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "padres_tutores_email_key" ON "padres_tutores"("email");

-- CreateIndex
CREATE INDEX "estudiantes_padreTutorId_idx" ON "estudiantes"("padreTutorId");

-- CreateIndex
CREATE INDEX "unidades_cursoId_idx" ON "unidades"("cursoId");

-- CreateIndex
CREATE INDEX "niveles_unidadId_idx" ON "niveles"("unidadId");

-- CreateIndex
CREATE INDEX "lecciones_nivelId_idx" ON "lecciones"("nivelId");

-- CreateIndex
CREATE INDEX "preguntas_leccionId_idx" ON "preguntas"("leccionId");

-- CreateIndex
CREATE INDEX "opciones_preguntaId_idx" ON "opciones"("preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "progresos_estudianteId_nivelId_key" ON "progresos"("estudianteId", "nivelId");

-- CreateIndex
CREATE INDEX "respuestas_registro_estudianteId_idx" ON "respuestas_registro"("estudianteId");

-- CreateIndex
CREATE INDEX "respuestas_registro_preguntaId_idx" ON "respuestas_registro"("preguntaId");

-- CreateIndex
CREATE INDEX "simulacro_resultados_estudianteId_idx" ON "simulacro_resultados"("estudianteId");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_padreTutorId_fkey" FOREIGN KEY ("padreTutorId") REFERENCES "padres_tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecciones" ADD CONSTRAINT "lecciones_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_leccionId_fkey" FOREIGN KEY ("leccionId") REFERENCES "lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresos" ADD CONSTRAINT "progresos_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresos" ADD CONSTRAINT "progresos_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_registro" ADD CONSTRAINT "respuestas_registro_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_registro" ADD CONSTRAINT "respuestas_registro_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulacro_resultados" ADD CONSTRAINT "simulacro_resultados_simulacroId_fkey" FOREIGN KEY ("simulacroId") REFERENCES "simulacros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulacro_resultados" ADD CONSTRAINT "simulacro_resultados_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
