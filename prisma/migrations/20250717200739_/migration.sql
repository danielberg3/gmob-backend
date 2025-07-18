-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('corretor', 'administrador');

-- CreateTable
CREATE TABLE "corretores" (
    "corretor_id" SERIAL NOT NULL,
    "nome_completo" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perfil" "Perfil" NOT NULL DEFAULT 'corretor',

    CONSTRAINT "corretores_pkey" PRIMARY KEY ("corretor_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "corretores_email_key" ON "corretores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "corretores_cpf_key" ON "corretores"("cpf");
