/*
  Warnings:

  - Added the required column `corretor_id` to the `transacoes_imoveis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transacoes_imoveis" ADD COLUMN     "corretor_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "transacoes_imoveis" ADD CONSTRAINT "transacoes_imoveis_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "corretores"("corretor_id") ON DELETE RESTRICT ON UPDATE CASCADE;
