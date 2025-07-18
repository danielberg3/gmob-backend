# API de Gerenciamento de imóveis - NestJS + Prisma + PostgreSQL + Redis

Este projeto implementa uma API completa para gerenciamento de corretores com sistema de autenticação JWT e cache Redis.

## 🏗️ Arquitetura

- **NestJS**: Framework Node.js para construção de APIs escaláveis
- **Prisma**: ORM moderno para TypeScript e Node.js
- **PostgreSQL**: Banco de dados relacional para persistência
- **Redis**: Cache em memória para otimização de performance
- **JWT**: Tokens para autenticação stateless

## 🔧 Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- Redis
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
copy .env.example .env

# Subir container com serviços de bancos de dados
docker-compose up

# Executar migrações do banco
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# Iniciar aplicação
npm run start:dev
```

## 📚 Endpoints da API

Ao criar uma nova entidade com suas respectivas rotas deve ser criado um arquivo como documentação seguindo o modelo de [corretor-request](request/corretor-request.http) para facilitar o teste dos endpoints.

## 🔒 Autorização

### Perfis de Usuário

- **corretor**: Pode gerenciar apenas seu próprio perfil
- **administrador**: Pode gerenciar todos os corretores

### Headers de Autenticação

```
Authorization: Bearer {jwt_token}
```
## 🗄️Banco de Dados

```bash
# Para acessar o Adminer (interface do banco):
http://localhost:8080

# Informações
Servidor: postgres
Usuário: postgres
Senha: password
Base de dados: gmob_db
```

## 📈 Monitoramento Redis

Para monitorar o uso do Redis:

```bash
# Conectar ao Redis CLI
redis-cli

# Listar todas as chaves
KEYS *

# Verificar TTL de uma chave
TTL jwt:1

# Monitorar comandos em tempo real
MONITOR
```