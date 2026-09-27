# Sistema de Protocolo de Pedidos — Cartório

Sistema de gestão de pedidos para cartório, com controle de status via máquina de estados, numeração sequencial de protocolo e histórico completo de movimentações.

Desenvolvido como desafio técnico para a Codeform Tecnologia.

## Stack utilizada

- **Backend:** NestJS + TypeScript
- **ORM:** Prisma ORM 7 (com driver adapter `@prisma/adapter-pg`)
- **Banco de dados:** PostgreSQL 18
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS
- **Testes:** Jest

## Pré-requisitos

- Node.js 24 (ou superior)
- PostgreSQL 18 (ou superior) instalado e rodando localmente
- npm

## Setup do zero

### 1. Clonar o repositório

```bash
git clone https://github.com/henrique445/CodeformProjeto.git
cd CodeformProjeto
```

### 2. Criar o banco de dados

Com o PostgreSQL rodando, crie o banco:

```bash
psql -U postgres
```

```sql
CREATE DATABASE codeform_cartorio;
\q
```

### 3. Configurar e subir o backend

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env` com o seguinte conteúdo (ajuste usuário/senha/porta conforme sua instalação local do PostgreSQL):

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/codeform_cartorio?schema=public"
PORT=3333
```

Rode as migrations (isso cria todas as tabelas):

```bash
npx prisma migrate dev
```

Popule o banco com os tipos de pedido iniciais:

```bash
npx prisma db seed
```

Suba o servidor:

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3333`.

### 4. Configurar e subir o frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie o arquivo `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Suba o frontend:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### 5. Rodar os testes automatizados

Com o PostgreSQL rodando (os testes de integração e concorrência usam o banco real, não mocks):

```bash
cd backend
npm run test
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/pedidos` | Cria um novo pedido |
| `GET` | `/pedidos` | Lista pedidos (filtros: `?status=`, `?tipoId=`, `?busca=`) |
| `GET` | `/pedidos/:id` | Detalhe de um pedido, com tipo e histórico de movimentações |
| `PATCH` | `/pedidos/:id/status` | Atualiza o status do pedido (valida a transição) |
| `GET` | `/tipos-pedido` | Lista os tipos de pedido cadastrados |

## Máquina de estados

```
PROTOCOLADO → EM_ANALISE → EM_EXIGENCIA → EM_ANALISE (pode alternar)
                         ↘ CONCLUIDO (estado final)
PROTOCOLADO / EM_ANALISE / EM_EXIGENCIA → CANCELADO (estado final)
```

Todas as transições são validadas no backend (`src/pedidos/pedido-state-machine.ts`), com uma única fonte de verdade sobre o que pode virar o quê. O frontend espelha esse mapa apenas para decidir quais botões exibir — a validação real acontece sempre no servidor, então uma tentativa de transição inválida é bloqueada mesmo que alguém chame a API diretamente.

## Numeração sequencial (AAAA/NNNNNN)

O maior risco técnico do desafio é gerar números sequenciais sem duplicar sob concorrência (múltiplos usuários protocolando pedidos ao mesmo tempo).

**Abordagem escolhida:** uma tabela de controle (`ContadorProtocolo`), com uma linha por ano, protegida por `SELECT ... FOR UPDATE` dentro de uma transação. Isso trava a linha do ano corrente até a criação do pedido terminar, garantindo que duas requisições simultâneas nunca leiam o mesmo "último número".

Essa abordagem foi validada com um teste automatizado que dispara 20 criações de pedido em paralelo (`src/pedidos/pedidos.concorrencia.spec.ts`) e confirma que todos os números gerados são únicos.

**Alternativa considerada:** `SEQUENCE` nativa do PostgreSQL. Foi descartada porque resetar uma sequence automaticamente a cada ano exigiria lógica adicional (trigger ou job agendado), enquanto a tabela de controle resolve o reset por ano de forma natural (uma linha nova por ano, começando do zero).

## Decisões de arquitetura

- **Monólito modular, não microsserviços.** Dado o prazo de 2 dias, um monólito bem modularizado (módulos separados para `pedidos`, `tipos-pedido`, `prisma`) entrega o mesmo valor de organização sem o overhead de comunicação entre serviços, deploy múltiplo, etc.
- **Prisma ORM 7.** Durante o desenvolvimento, o pacote `prisma` no npm passou a apontar por padrão para uma versão 8 ainda em Release Candidate. Foi necessário fixar explicitamente a versão 7 (estável) e configurar um driver adapter (`@prisma/adapter-pg`), que se tornou obrigatório nessa versão do Prisma.
- **Validação de DTOs com `class-validator`.** Todo dado que entra na API passa por um `ValidationPipe` global, rejeitando campos não esperados (`forbidNonWhitelisted`) e validando tipos/formatos antes de chegar na lógica de negócio.
- **Histórico de movimentações como tabela própria**, e não como um campo JSON no pedido. Isso permite consultas e ordenação pelo histórico sem parsing manual, e mantém a integridade referencial (uma movimentação não pode existir sem o pedido correspondente).

## Trade-offs conhecidos

- Não há autenticação/autorização implementada — fora do escopo definido para este desafio, mas seria o primeiro item de segurança a adicionar antes de um uso real.
- A listagem de pedidos não tem paginação — aceitável para o volume de dados do desafio, mas precisaria de `LIMIT`/`OFFSET` (ou cursor) em produção.
- O frontend não tem testes automatizados, apenas o backend. Priorizei testar a lógica de maior risco (máquina de estados e concorrência) dado o tempo disponível.

## O que eu faria com mais tempo

- Adicionar autenticação (JWT) e controle de permissões por perfil de usuário (atendente, analista, administrador)
- Paginação e ordenação configurável na listagem de pedidos
- Dockerizar a aplicação inteira (backend, frontend, PostgreSQL) com `docker-compose`, facilitando a avaliação em qualquer máquina sem precisar instalar PostgreSQL localmente
- Visualização em Kanban para o frontend, com drag-and-drop entre colunas de status
- Endpoint de IA para sugerir automaticamente o tipo de pedido a partir da descrição em texto livre
- Testes automatizados no frontend (React Testing Library)
- Uso de Redis para cache da listagem de tipos de pedido (dado que muda raramente) e/ou rate limiting nas rotas de criação
