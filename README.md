# ecommerce-platform

TypeScript monorepo for an e-commerce platform. Managed with **pnpm workspaces** and **Turborepo**.

## Structure

```
ecommerce/
├── apps/
│   ├── frontend/    Next.js 15 (App Router, TypeScript, Tailwind)
│   └── api/         Express + TypeScript (Prisma, Zod, JWT)
├── packages/
│   ├── types/       Shared DTOs (Product, Order, Auth)
│   ├── database/    Prisma client + schema
│   └── config/      Shared tsconfig and eslint base
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Requirements

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (for the API)

## Install

From the repo root:

```bash
pnpm install
```

## Environment

Copy the API env template and fill in real values:

```bash
cp apps/api/.env.example apps/api/.env
```

## Database

```bash
pnpm db:generate   # generate the Prisma client
pnpm db:migrate    # run dev migrations
```

## Run

Run everything in dev mode:

```bash
pnpm dev
```

Or run apps individually:

```bash
pnpm dev:api        # Express API on PORT (default 4000)
pnpm dev:frontend   # Next.js on http://localhost:3000
```

## Build / Lint / Typecheck

```bash
pnpm build
pnpm lint
pnpm typecheck
```

All tasks are orchestrated by Turborepo and respect inter-package dependencies.

## Packages

| Package              | Purpose                              |
| -------------------- | ------------------------------------ |
| `@ecommerce/api`     | Express HTTP API                     |
| `@ecommerce/frontend`| Next.js 15 web app                   |
| `@ecommerce/types`   | Shared DTOs                          |
| `@ecommerce/database`| Prisma client and schema             |
| `@ecommerce/config`  | Shared tsconfig/eslint base configs  |
