-- AlterTable
ALTER TABLE "progresos" ADD COLUMN     "mejorPorcentaje" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "respuestas_registro" ADD COLUMN     "sesionLeccionId" TEXT;

-- CreateTable
CREATE TABLE "sesiones_leccion" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "leccionId" TEXT NOT NULL,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadaEn" TIMESTAMP(3),
    "porcentaje" INTEGER,

    CONSTRAINT "sesiones_leccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sesiones_leccion_estudianteId_leccionId_idx" ON "sesiones_leccion"("estudianteId", "leccionId");

-- CreateIndex
CREATE INDEX "respuestas_registro_sesionLeccionId_idx" ON "respuestas_registro"("sesionLeccionId");

-- AddForeignKey
ALTER TABLE "sesiones_leccion" ADD CONSTRAINT "sesiones_leccion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_leccion" ADD CONSTRAINT "sesiones_leccion_leccionId_fkey" FOREIGN KEY ("leccionId") REFERENCES "lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_registro" ADD CONSTRAINT "respuestas_registro_sesionLeccionId_fkey" FOREIGN KEY ("sesionLeccionId") REFERENCES "sesiones_leccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
