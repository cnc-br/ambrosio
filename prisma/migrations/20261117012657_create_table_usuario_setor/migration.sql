-- CreateTable
CREATE TABLE "usuarioSetor" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "setorId" INTEGER NOT NULL,

    CONSTRAINT "usuarioSetor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarioSetor_userId_setorId_key" ON "usuarioSetor"("userId", "setorId");

-- AddForeignKey
ALTER TABLE "usuarioSetor" ADD CONSTRAINT "usuarioSetor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioSetor" ADD CONSTRAINT "usuarioSetor_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra os usuarios que hoje sao secretaria local para o novo perfil SECRETARIA_PAROQUIA.
-- O SECRETARIA_CNC passa a ser o perfil nacional de secretaria por setor.
UPDATE "user" SET role = 'SECRETARIA_PAROQUIA' WHERE role = 'SECRETARIA_CNC';
