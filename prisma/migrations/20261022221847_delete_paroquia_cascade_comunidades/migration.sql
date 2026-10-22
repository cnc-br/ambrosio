-- DropForeignKey
ALTER TABLE "comunidade" DROP CONSTRAINT "comunidade_paroquiaId_fkey";

-- AddForeignKey
ALTER TABLE "comunidade" ADD CONSTRAINT "comunidade_paroquiaId_fkey" FOREIGN KEY ("paroquiaId") REFERENCES "paroquia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
