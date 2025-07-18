#!/bin/bash

echo "🚀 Configurando projeto GMOB API..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Configure as variáveis conforme necessário."
fi

# Iniciar serviços Docker
echo "🐳 Iniciando PostgreSQL e Redis..."
docker-compose up -d postgres redis

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar migrações
echo "🗄️ Executando migrações do banco..."
npx prisma migrate dev --name init

# Verificar se tudo está funcionando
echo "🔍 Verificando configuração..."

# Testar conexão com PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres; then
    echo "✅ PostgreSQL conectado com sucesso"
else
    echo "❌ Erro ao conectar com PostgreSQL"
fi

# Testar conexão com Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis conectado com sucesso"
else
    echo "❌ Erro ao conectar com Redis"
fi

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "Para iniciar a aplicação:"
echo "  npm run start:dev"
echo ""
echo "Para acessar o Adminer (interface do banco):"
echo "  http://localhost:8080"
echo "  Servidor: postgres"
echo "  Usuário: postgres"
echo "  Senha: password"
echo "  Base de dados: gmob_db"
echo ""
echo "Para monitorar o Redis:"
echo "  docker-compose exec redis redis-cli"
echo ""

