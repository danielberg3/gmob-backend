/*
  Warnings:

  - A unique constraint covering the columns `[imovel_id,data_visita]` on the table `agendamentos_visitas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "agendamentos_visitas_cliente_id_imovel_id_data_visita_hora__key";

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_visitas_imovel_id_data_visita_key" ON "agendamentos_visitas"("imovel_id", "data_visita");
