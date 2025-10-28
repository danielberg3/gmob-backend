-- CreateEnum
CREATE TYPE "Disponibilidade" AS ENUM ('venda', 'aluguel', 'ambos');

-- AlterTable
ALTER TABLE "imoveis" ADD COLUMN     "disponibilidade" "Disponibilidade" NOT NULL DEFAULT 'ambos',
ADD COLUMN     "valor_aluguel" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "imagens_imoveis" (
    "imagem_id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "imovel_id" INTEGER NOT NULL,

    CONSTRAINT "imagens_imoveis_pkey" PRIMARY KEY ("imagem_id")
);

-- AddForeignKey
ALTER TABLE "imagens_imoveis" ADD CONSTRAINT "imagens_imoveis_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("imovel_id") ON DELETE RESTRICT ON UPDATE CASCADE;
