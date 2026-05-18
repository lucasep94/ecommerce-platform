# ◈ Storely

> A full-stack e-commerce platform built as a portfolio project — monorepo architecture, clean layered API, and a modern React frontend.

---

## Overview

Storely is a production-grade e-commerce application structured as a **pnpm monorepo** with two independent apps and shared internal packages. The goal was to build something that reflects real-world architecture decisions: a decoupled API with clear separation of concerns, type-safe contracts between services, and a frontend optimized for both UX and SEO.

---

## Stack

### Frontend — `apps/frontend`
| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind v4 + shadcn/ui |
| Server state | TanStack Query |
| Auth | NextAuth v5 |
| HTTP client | ky |
| Forms | React Hook Form + Zod |
| Deploy | Vercel |

### API — `apps/api`
| | |
|---|---|
| Framework | Express |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL via Supabase |
| Validation | Zod |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe |
| Deploy | Railway |

---

## Architecture

```
┌──────────────────────┐      HTTPS / JSON      ┌──────────────────────┐
│   apps/frontend      │ ◄──────────────────── ► │   apps/api           │
│   Next.js 15         │      JWT Bearer          │   Express            │
│   → Vercel           │                          │   → Railway          │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │
                                                  ┌──────────┴───────────┐
                                                  │   Supabase           │
                                                  │   PostgreSQL + RLS   │
                                                  └──────────────────────┘
```

The API follows a strict **layered architecture**:

```
Request → Route → Controller → Service → Repository → Prisma → DB
```

Each layer has a single responsibility. Business logic never leaks into controllers, and database queries never appear in services.

---

## Monorepo structure

```
ecommerce/
├── apps/
│   ├── frontend/          Next.js 15 app
│   └── api/               Express REST API
├── packages/
│   ├── database/          Prisma schema + singleton client
│   ├── types/             Shared DTOs (request/response contracts)
│   └── config/            Base tsconfig and ESLint config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Managed with **Turborepo** — only the apps affected by a change get rebuilt on each push.

---

## Key features

- 🛍 Product catalog with filtering and pagination
- 🔐 JWT authentication with access + refresh token rotation
- 🛒 Cart and checkout flow
- 💳 Stripe payments in test mode
- 📦 Order management with status tracking
- 🔒 CORS, Helmet, and rate limiting on auth endpoints
- 🧪 Database seeded with realistic fake data via Faker.js

---

## Getting started

**Requirements:** Node.js 18+, pnpm 9+

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/ecommerce.git
cd ecommerce

# 2. Install all dependencies from the root
pnpm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env.local
cp apps/frontend/.env.example apps/frontend/.env.local
# Fill in the values in both files

# 4. Run database migrations and seed
cd apps/api
pnpm db:migrate
pnpm db:seed

# 5. Start both apps in development
cd ../..
pnpm dev
```

Frontend runs on `http://localhost:3000`  
API runs on `http://localhost:3001`

---

## Environment variables

### `apps/api/.env.example`

```bash
DATABASE_URL=
DIRECT_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### `apps/frontend/.env.example`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

> Stripe test card: `4242 4242 4242 4242` — any future expiry, any CVC.

---

## Security notes

- Secrets are never committed — only `.env.example` files with empty values are in the repo
- CORS is locked to the frontend domain (no wildcard `*`)
- Rate limiting on `/auth/login` and `/auth/register`
- Stripe webhooks verified with payload signature before processing
- Passwords hashed with bcrypt
- Prices stored as integers in cents to avoid floating point errors
- Supabase RLS enabled as a second layer of access control

---

## Deployment

| App | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Push to `main` |
| API | Railway | Push to `main` |
| Database | Supabase | Manual migrations |

Turborepo's remote cache ensures only changed apps are rebuilt on each deploy.

---

## Design decisions

**Why a monorepo?** Shared types between frontend and API without publishing to npm. A contract change breaks both apps at build time, not at runtime.

**Why Express over Fastify?** Familiarity and ecosystem maturity. The layered architecture is framework-agnostic — migrating to Fastify would only affect the route layer.

**Why Prisma?** Type-safe queries, a readable schema file as the single source of truth for the data model, and first-class support for Supabase.

**Why prices in cents?** Floating point arithmetic on monetary values causes subtle bugs. Storing `1999` instead of `19.99` and formatting at display time is the standard approach used by Stripe itself.

---

## License

MIT