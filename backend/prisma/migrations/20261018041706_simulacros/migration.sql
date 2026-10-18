-- AlterTable
ALTER TABLE "respuestas_registro" ADD COLUMN     "sesionSimulacroId" TEXT;

-- AlterTable
ALTER TABLE "simulacro_resultados" ADD COLUMN     "puntos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sesionSimulacroId" TEXT NOT NULL,
ADD COLUMN     "sinResponder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidadesAReforzarIds" TEXT[];

-- AlterTable
ALTER TABLE "simulacros" ADD COLUMN     "numeroPreguntas" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "sesiones_simulacro" (
    "id" TEXT NOT NULL,
    "simulacroId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "venceEn" TIMESTAMP(3) NOT NULL,
    "preguntasIds" TEXT[],
    "finalizadaEn" TIMESTAMP(3),

    CONSTRAINT "sesiones_simulacro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sesiones_simulacro_estudianteId_idx" ON "sesiones_simulacro"("estudianteId");

-- CreateIndex
CREATE INDEX "respuestas_registro_sesionSimulacroId_idx" ON "respuestas_registro"("sesionSimulacroId");

-- CreateIndex
CREATE UNIQUE INDEX "simulacro_resultados_sesionSimulacroId_key" ON "simulacro_resultados"("sesionSimulacroId");

-- AddForeignKey
ALTER TABLE "respuestas_registro" ADD CONSTRAINT "respuestas_registro_sesionSimulacroId_fkey" FOREIGN KEY ("sesionSimulacroId") REFERENCES "sesiones_simulacro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_simulacro" ADD CONSTRAINT "sesiones_simulacro_simulacroId_fkey" FOREIGN KEY ("simulacroId") REFERENCES "simulacros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_simulacro" ADD CONSTRAINT "sesiones_simulacro_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulacro_resultados" ADD CONSTRAINT "simulacro_resultados_sesionSimulacroId_fkey" FOREIGN KEY ("sesionSimulacroId") REFERENCES "sesiones_simulacro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

