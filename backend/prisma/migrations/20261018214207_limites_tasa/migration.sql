-- CreateTable
CREATE TABLE "limites_tasa" (
    "clave" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "reiniciaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limites_tasa_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE INDEX "limites_tasa_reiniciaEn_idx" ON "limites_tasa"("reiniciaEn");
