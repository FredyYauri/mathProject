-- AlterTable
ALTER TABLE "preguntas" ADD COLUMN     "maxIntentos" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "pistaDesdeError" INTEGER NOT NULL DEFAULT 1;
