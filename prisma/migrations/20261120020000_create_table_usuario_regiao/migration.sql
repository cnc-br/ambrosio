-- CreateTable
CREATE TABLE "usuarioRegiao" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "regiaoId" INTEGER NOT NULL,

    CONSTRAINT "usuarioRegiao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarioRegiao_userId_regiaoId_key" ON "usuarioRegiao"("userId", "regiaoId");

-- AddForeignKey
ALTER TABLE "usuarioRegiao" ADD CONSTRAINT "usuarioRegiao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioRegiao" ADD CONSTRAINT "usuarioRegiao_regiaoId_fkey" FOREIGN KEY ("regiaoId") REFERENCES "regiao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra os vinculos por setor para a regiao de cada setor, preservando o acesso
-- existente e ampliando-o para toda a regiao.
INSERT INTO "usuarioRegiao" ("userId", "regiaoId")
SELECT DISTINCT us."userId", s."regiaoId"
FROM "usuarioSetor" us
JOIN "setor" s ON s."id" = us."setorId"
ON CONFLICT DO NOTHING;

-- DropTable
DROP TABLE "usuarioSetor";
