-- AlterTable
ALTER TABLE "aviso" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- AlterTable
ALTER TABLE "carisma" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "cidade" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "comunidade" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- AlterTable
ALTER TABLE "comunidadeEtapa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- AlterTable
ALTER TABLE "comunidadeHistorico" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "comunidadePessoa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "diocese" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- AlterTable
ALTER TABLE "endereco" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "equipe" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT;

-- AlterTable
ALTER TABLE "equipePessoa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "escolaridade" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "estado" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "estadoCivil" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "etapa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "localidade" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "macroRegiao" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pais" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "paroquia" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "passaportePessoa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pessoaCarisma" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pessoaCasal" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pessoaEndereco" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "regiao" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "setor" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "situacaoReligiosa" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tipoDiocese" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tipoEquipe" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tipoLocalidade" ADD COLUMN     "atualizadoPorId" TEXT,
ADD COLUMN     "cadastradoPorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "aviso_cadastradoPorId_idx" ON "aviso"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "aviso_atualizadoPorId_idx" ON "aviso"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "carisma_cadastradoPorId_idx" ON "carisma"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "carisma_atualizadoPorId_idx" ON "carisma"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "cidade_cadastradoPorId_idx" ON "cidade"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "cidade_atualizadoPorId_idx" ON "cidade"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "comunidade_cadastradoPorId_idx" ON "comunidade"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "comunidade_atualizadoPorId_idx" ON "comunidade"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "comunidadeEtapa_cadastradoPorId_idx" ON "comunidadeEtapa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "comunidadeEtapa_atualizadoPorId_idx" ON "comunidadeEtapa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "comunidadeHistorico_cadastradoPorId_idx" ON "comunidadeHistorico"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "comunidadeHistorico_atualizadoPorId_idx" ON "comunidadeHistorico"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "comunidadePessoa_cadastradoPorId_idx" ON "comunidadePessoa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "comunidadePessoa_atualizadoPorId_idx" ON "comunidadePessoa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "diocese_cadastradoPorId_idx" ON "diocese"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "diocese_atualizadoPorId_idx" ON "diocese"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "endereco_cadastradoPorId_idx" ON "endereco"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "endereco_atualizadoPorId_idx" ON "endereco"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "equipe_cadastradoPorId_idx" ON "equipe"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "equipe_atualizadoPorId_idx" ON "equipe"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "equipePessoa_cadastradoPorId_idx" ON "equipePessoa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "equipePessoa_atualizadoPorId_idx" ON "equipePessoa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "escolaridade_cadastradoPorId_idx" ON "escolaridade"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "escolaridade_atualizadoPorId_idx" ON "escolaridade"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "estado_cadastradoPorId_idx" ON "estado"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "estado_atualizadoPorId_idx" ON "estado"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "estadoCivil_cadastradoPorId_idx" ON "estadoCivil"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "estadoCivil_atualizadoPorId_idx" ON "estadoCivil"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "etapa_cadastradoPorId_idx" ON "etapa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "etapa_atualizadoPorId_idx" ON "etapa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "localidade_cadastradoPorId_idx" ON "localidade"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "localidade_atualizadoPorId_idx" ON "localidade"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "macroRegiao_cadastradoPorId_idx" ON "macroRegiao"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "macroRegiao_atualizadoPorId_idx" ON "macroRegiao"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "pais_cadastradoPorId_idx" ON "pais"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "pais_atualizadoPorId_idx" ON "pais"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "paroquia_cadastradoPorId_idx" ON "paroquia"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "paroquia_atualizadoPorId_idx" ON "paroquia"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "passaportePessoa_cadastradoPorId_idx" ON "passaportePessoa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "passaportePessoa_atualizadoPorId_idx" ON "passaportePessoa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "pessoaCarisma_cadastradoPorId_idx" ON "pessoaCarisma"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "pessoaCarisma_atualizadoPorId_idx" ON "pessoaCarisma"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "pessoaCasal_cadastradoPorId_idx" ON "pessoaCasal"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "pessoaCasal_atualizadoPorId_idx" ON "pessoaCasal"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "pessoaEndereco_cadastradoPorId_idx" ON "pessoaEndereco"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "pessoaEndereco_atualizadoPorId_idx" ON "pessoaEndereco"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "regiao_cadastradoPorId_idx" ON "regiao"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "regiao_atualizadoPorId_idx" ON "regiao"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "setor_cadastradoPorId_idx" ON "setor"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "setor_atualizadoPorId_idx" ON "setor"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "situacaoReligiosa_cadastradoPorId_idx" ON "situacaoReligiosa"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "situacaoReligiosa_atualizadoPorId_idx" ON "situacaoReligiosa"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "tipoDiocese_cadastradoPorId_idx" ON "tipoDiocese"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "tipoDiocese_atualizadoPorId_idx" ON "tipoDiocese"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "tipoEquipe_cadastradoPorId_idx" ON "tipoEquipe"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "tipoEquipe_atualizadoPorId_idx" ON "tipoEquipe"("atualizadoPorId");

-- CreateIndex
CREATE INDEX "tipoLocalidade_cadastradoPorId_idx" ON "tipoLocalidade"("cadastradoPorId");

-- CreateIndex
CREATE INDEX "tipoLocalidade_atualizadoPorId_idx" ON "tipoLocalidade"("atualizadoPorId");

-- AddForeignKey
ALTER TABLE "pais" ADD CONSTRAINT "pais_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pais" ADD CONSTRAINT "pais_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado" ADD CONSTRAINT "estado_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado" ADD CONSTRAINT "estado_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cidade" ADD CONSTRAINT "cidade_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cidade" ADD CONSTRAINT "cidade_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco" ADD CONSTRAINT "endereco_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco" ADD CONSTRAINT "endereco_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estadoCivil" ADD CONSTRAINT "estadoCivil_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estadoCivil" ADD CONSTRAINT "estadoCivil_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolaridade" ADD CONSTRAINT "escolaridade_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolaridade" ADD CONSTRAINT "escolaridade_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situacaoReligiosa" ADD CONSTRAINT "situacaoReligiosa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situacaoReligiosa" ADD CONSTRAINT "situacaoReligiosa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carisma" ADD CONSTRAINT "carisma_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carisma" ADD CONSTRAINT "carisma_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaCarisma" ADD CONSTRAINT "pessoaCarisma_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaCarisma" ADD CONSTRAINT "pessoaCarisma_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaEndereco" ADD CONSTRAINT "pessoaEndereco_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaEndereco" ADD CONSTRAINT "pessoaEndereco_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaCasal" ADD CONSTRAINT "pessoaCasal_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoaCasal" ADD CONSTRAINT "pessoaCasal_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passaportePessoa" ADD CONSTRAINT "passaportePessoa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passaportePessoa" ADD CONSTRAINT "passaportePessoa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoDiocese" ADD CONSTRAINT "tipoDiocese_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoDiocese" ADD CONSTRAINT "tipoDiocese_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diocese" ADD CONSTRAINT "diocese_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diocese" ADD CONSTRAINT "diocese_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paroquia" ADD CONSTRAINT "paroquia_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paroquia" ADD CONSTRAINT "paroquia_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoEquipe" ADD CONSTRAINT "tipoEquipe_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoEquipe" ADD CONSTRAINT "tipoEquipe_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipe" ADD CONSTRAINT "equipe_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipe" ADD CONSTRAINT "equipe_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipePessoa" ADD CONSTRAINT "equipePessoa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipePessoa" ADD CONSTRAINT "equipePessoa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localidade" ADD CONSTRAINT "localidade_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localidade" ADD CONSTRAINT "localidade_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoLocalidade" ADD CONSTRAINT "tipoLocalidade_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoLocalidade" ADD CONSTRAINT "tipoLocalidade_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor" ADD CONSTRAINT "setor_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor" ADD CONSTRAINT "setor_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "macroRegiao" ADD CONSTRAINT "macroRegiao_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "macroRegiao" ADD CONSTRAINT "macroRegiao_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regiao" ADD CONSTRAINT "regiao_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regiao" ADD CONSTRAINT "regiao_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidade" ADD CONSTRAINT "comunidade_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidade" ADD CONSTRAINT "comunidade_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadeEtapa" ADD CONSTRAINT "comunidadeEtapa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadeEtapa" ADD CONSTRAINT "comunidadeEtapa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadePessoa" ADD CONSTRAINT "comunidadePessoa_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadePessoa" ADD CONSTRAINT "comunidadePessoa_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadeHistorico" ADD CONSTRAINT "comunidadeHistorico_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunidadeHistorico" ADD CONSTRAINT "comunidadeHistorico_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
