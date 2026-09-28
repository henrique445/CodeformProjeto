# Sistema de Protocolo de Pedidos — Cartório

Sistema de gestão de pedidos para cartório, com controle de status por máquina de estados, numeração sequencial de protocolo (`AAAA/NNNNNN`) e histórico completo de movimentações.

Desenvolvido como desafio técnico para a Codeform Tecnologia.

## Stack

- **Backend:** NestJS + TypeScript
- **ORM:** Prisma ORM 7 (com driver adapter `@prisma/adapter-pg`)
- **Banco de dados:** PostgreSQL 18, via Docker Compose
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS
- **Testes:** Jest

## Pré-requisitos

- Node.js 24 ou superior
- Docker Desktop (para o PostgreSQL)
- npm

## Setup

Da raiz do repositório, em ordem:

```bash
git clone https://github.com/henrique445/CodeformProjeto.git
cd CodeformProjeto
```

### 1. Subir o banco de dados

```bash
docker compose up -d
docker compose ps
```

O `ps` deve mostrar o serviço `db` como `running`. O banco fica exposto na porta **5433** do host (a 5432 é deixada livre para quem já tem um PostgreSQL local) e os dados persistem em um volume Docker.

### 2. Backend

```bash
cd backend
npm install
```

Crie o `.env` a partir do exemplo (já vem com os valores do `docker-compose.yml`):

```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Gere o client do Prisma, crie as tabelas e popule o banco:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

O seed cria os 8 tipos de pedido e **um pedido de exemplo** (`AAAA/000001`, em análise, com histórico), para o sistema abrir com dados. Ele só cria o exemplo se o banco não tiver nenhum pedido, então rodar o seed de novo não duplica nada.

Suba a API:

```bash
npm run start:dev
```

API em `http://localhost:3333`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie o `.env.local` a partir do exemplo:

```bash
# Linux / macOS / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
npm run dev
```

Aplicação em `http://localhost:3000`.

### 4. Testes automatizados

Com o banco no ar:

```bash
cd backend
npm run test
```

São 18 testes: máquina de estados, concorrência na numeração e fluxo de integração do CRUD. Os testes de integração e de concorrência usam o banco real, sem mocks. Eles criam e removem os próprios dados, mas **consomem números de protocolo**: a numeração não é reaproveitada, como em um protocolo real. Depois de rodar os testes, o próximo pedido criado pela interface terá um número mais alto.

### Comandos úteis do banco

```bash
docker compose down        # para o banco, mantém os dados
docker compose up -d       # sobe de novo, dados preservados
docker compose down -v     # apaga o banco e os dados (recomeça do zero)
```

Depois de um `down -v`, repita `npx prisma migrate dev` e `npx prisma db seed`.

As credenciais do `docker-compose.yml` (`postgres` / `1234`) são apenas para desenvolvimento local.

## API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/pedidos` | Cria um pedido |
| `GET` | `/pedidos` | Lista pedidos (filtros: `?status=`, `?tipoId=`, `?busca=`) |
| `GET` | `/pedidos/:id` | Detalhe, com tipo e histórico de movimentações |
| `PATCH` | `/pedidos/:id/status` | Atualiza o status (valida a transição) |
| `GET` | `/tipos-pedido` | Lista os tipos de pedido |

## Máquina de estados

| De | Para |
|---|---|
| `PROTOCOLADO` | `EM_ANALISE`, `CANCELADO` |
| `EM_ANALISE` | `EM_EXIGENCIA`, `CONCLUIDO`, `CANCELADO` |
| `EM_EXIGENCIA` | `EM_ANALISE`, `CANCELADO` |
| `CONCLUIDO` | — (estado final) |
| `CANCELADO` | — (estado final) |

As transições são validadas no backend (`backend/src/pedidos/pedido-state-machine.ts`), que é a única fonte de verdade. O frontend espelha o mapa apenas para decidir quais botões exibir; uma transição inválida é rejeitada com `400` mesmo se alguém chamar a API diretamente. Estados finais são transições vazias de propósito: um pedido concluído ou cancelado não é reaberto.

## Numeração sequencial (AAAA/NNNNNN)

O maior risco técnico do desafio é gerar números sequenciais sem duplicar sob concorrência.

**Abordagem:** uma tabela de controle (`ContadorProtocolo`) com uma linha por ano, lida com `SELECT ... FOR UPDATE` dentro de uma transação. A linha do ano fica travada até o pedido ser criado, então duas requisições simultâneas nunca leem o mesmo "último número". A criação do pedido e do primeiro registro de histórico acontecem na mesma transação.

Isso é validado por um teste automatizado que dispara 20 criações em paralelo (`backend/src/pedidos/pedidos.concorrencia.spec.ts`) e confirma que todos os números são únicos.

**Alternativa descartada:** `SEQUENCE` nativa do PostgreSQL. Resetar uma sequence a cada ano exigiria trigger ou job agendado; a tabela de controle resolve o reset naturalmente (uma linha nova por ano, começando em zero).

## Decisões de arquitetura

- **Monólito modular.** Com prazo curto, módulos separados (`pedidos`, `tipos-pedido`, `prisma`) dão organização sem o custo de operar vários serviços.
- **Prisma ORM 7.** O pacote `prisma` no npm passou a apontar por padrão para a versão 8, ainda em release candidate, com fluxo diferente. A versão 7 foi fixada de propósito. Nela o driver adapter é obrigatório, e o client é gerado em CommonJS (`moduleFormat = "cjs"`) dentro de `backend/src/generated`, pasta ignorada pelo Git. Por isso o setup exige `npx prisma generate`.
- **Validação de entrada.** Um `ValidationPipe` global com `class-validator` rejeita campos desconhecidos (`forbidNonWhitelisted`) e valida tipos antes da regra de negócio.
- **Histórico como tabela própria** (`Movimentacao`), não como JSON no pedido: permite consulta e ordenação diretas e mantém integridade referencial.
- **Docker apenas para o banco.** O objetivo era um setup reproduzível sem instalar PostgreSQL. Backend e frontend continuam rodando com `npm`, porque containerizar o backend traria a complexidade extra dos binários nativos do Prisma em Linux. A imagem `postgres:18` monta o volume em `/var/lib/postgresql` (o caminho mudou a partir da versão 18).
- **Seed com pedido de exemplo**, idempotente, que também acerta o contador de protocolo para o próximo pedido não colidir.

## Trade-offs conhecidos

- Sem autenticação/autorização; seria o primeiro item de segurança antes de uso real.
- Listagem sem paginação, aceitável para o volume do desafio.
- Sem testes automatizados no frontend; priorizei a lógica de maior risco (máquina de estados e concorrência).
- Os testes compartilham o banco de desenvolvimento e consomem números de protocolo.
- Os menus dos `<select>` usam o estilo nativo do navegador, que varia entre navegadores.

## O que eu faria com mais tempo

- Autenticação (JWT) e permissões por perfil (atendente, analista, administrador)
- Paginação e ordenação configurável
- Banco separado para os testes, para não consumir a numeração de desenvolvimento
- Dockerizar backend e frontend, com um único `docker compose up` para tudo
- Visão Kanban com arrastar e soltar entre colunas de status
- Endpoint de IA para sugerir o tipo de pedido a partir da descrição
- Testes automatizados no frontend
- Redis para cache da lista de tipos de pedido e rate limiting na criação
