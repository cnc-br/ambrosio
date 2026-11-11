-- AlterTable
ALTER TABLE "pessoa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- CreateIndex
CREATE INDEX "pessoa_cadastradoPorId_idx" ON "pessoa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "pessoa_atualizadoPorId_idx" ON "pessoa"("atualizadoPorId");

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
