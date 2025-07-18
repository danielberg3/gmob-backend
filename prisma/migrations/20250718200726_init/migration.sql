-- CreateEnum
CREATE TYPE "StatusImovel" AS ENUM ('disponivel', 'vendido', 'alugado');

-- CreateEnum
CREATE TYPE "TipoInteresseCliente" AS ENUM ('compra', 'aluguel');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('agendado', 'confirmado', 'cancelado', 'realizado');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('venda', 'aluguel');

-- CreateTable
CREATE TABLE "tipos_imoveis" (
    "tipo_imovel_id" SERIAL NOT NULL,
    "nome_tipo" VARCHAR(50) NOT NULL,

    CONSTRAINT "tipos_imoveis_pkey" PRIMARY KEY ("tipo_imovel_id")
);

-- CreateTable
CREATE TABLE "imoveis" (
    "imovel_id" SERIAL NOT NULL,
    "corretor_id" INTEGER NOT NULL,
    "tipo_imovel_id" INTEGER NOT NULL,
    "status" "StatusImovel" NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "rua" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "valor" DECIMAL(15,2) NOT NULL,
    "area" DECIMAL(10,2) NOT NULL,
    "numero_comodos" INTEGER NOT NULL,
    "descricao" TEXT,
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("imovel_id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "cliente_id" SERIAL NOT NULL,
    "corretor_id" INTEGER NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "tipo_interesse" "TipoInteresseCliente" NOT NULL,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("cliente_id")
);

-- CreateTable
CREATE TABLE "agendamentos_visitas" (
    "agendamento_id" SERIAL NOT NULL,
    "corretor_id" INTEGER NOT NULL,
    "imovel_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "data_visita" DATE NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_termino" TIME(0) NOT NULL,
    "observacoes" TEXT,
    "status_agendamento" "StatusAgendamento" NOT NULL DEFAULT 'agendado',
    "data_agendamento" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_visitas_pkey" PRIMARY KEY ("agendamento_id")
);

-- CreateTable
CREATE TABLE "transacoes_imoveis" (
    "transacao_id" SERIAL NOT NULL,
    "imovel_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "tipo_transacao" "TipoTransacao" NOT NULL,
    "data_transacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacoes_imoveis_pkey" PRIMARY KEY ("transacao_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_imoveis_nome_tipo_key" ON "tipos_imoveis"("nome_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "imoveis_rua_numero_complemento_key" ON "imoveis"("rua", "numero", "complemento");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_visitas_cliente_id_imovel_id_data_visita_hora__key" ON "agendamentos_visitas"("cliente_id", "imovel_id", "data_visita", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_imoveis_imovel_id_cliente_id_tipo_transacao_key" ON "transacoes_imoveis"("imovel_id", "cliente_id", "tipo_transacao");

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "corretores"("corretor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_tipo_imovel_id_fkey" FOREIGN KEY ("tipo_imovel_id") REFERENCES "tipos_imoveis"("tipo_imovel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "corretores"("corretor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos_visitas" ADD CONSTRAINT "agendamentos_visitas_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "corretores"("corretor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos_visitas" ADD CONSTRAINT "agendamentos_visitas_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("imovel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos_visitas" ADD CONSTRAINT "agendamentos_visitas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_imoveis" ADD CONSTRAINT "transacoes_imoveis_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("imovel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_imoveis" ADD CONSTRAINT "transacoes_imoveis_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;
