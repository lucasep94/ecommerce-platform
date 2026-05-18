# @ecommerce/api

Express + TypeScript API for the e-commerce platform.

## Setup

From the **monorepo root**:

```bash
pnpm install
```

Copy the environment template and fill in values:

```bash
cp apps/api/.env.example apps/api/.env
```

Generate the Prisma client and run migrations (requires a running Postgres):

```bash
pnpm db:generate
pnpm db:migrate
```

## Run

From the monorepo root:

```bash
pnpm dev:api
```

Or from this directory:

```bash
pnpm dev
```

The API will start on `http://localhost:${PORT}` (default `4000`).

Health check: `GET /health`.

## Structure

```
src/
├── routes/         HTTP route definitions
├── controllers/    Request/response handlers
├── services/       Business logic
├── repositories/   Data access (Prisma)
├── middlewares/    Express middlewares
├── schemas/        Zod validation schemas
├── lib/
│   ├── prisma.ts   PrismaClient singleton
│   └── jwt.ts      JWT sign/verify utilities
└── app.ts          Express app setup
```

## Stack

Express, TypeScript, Prisma, Zod, jsonwebtoken, bcrypt, cors, helmet, express-rate-limit, dotenv.
