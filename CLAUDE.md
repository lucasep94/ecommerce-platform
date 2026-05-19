# E-commerce — Visión general de arquitectura

> **Development plan & phase status:** see [PLAN.md](PLAN.md)

## Estructura del monorepo

Un único repositorio gestionado con **pnpm workspaces** y **Turborepo**, con dos aplicaciones independientes y paquetes internos compartidos.

```
ecommerce/
├── apps/
│   ├── frontend/        ← Next.js 15
│   └── api/             ← Express
├── packages/
│   ├── types/           ← DTOs compartidos
│   ├── database/        ← Prisma schema + client
│   └── config/          ← tsconfig y eslint base
├── turbo.json
└── package.json
```

---

## Aplicaciones

### Frontend — `apps/frontend`

Interfaz de usuario construida con **Next.js 15** usando App Router. Se comunica exclusivamente con la API interna via HTTP.

- Renderizado híbrido: SSR para páginas de catálogo (SEO), CSR para carrito y checkout
- Autenticación gestionada por **Clerk** (`@clerk/nextjs`): signup/login con email + password y SSO (Google y otros providers toggleables en el dashboard). Clerk gestiona sesión, refresh, password reset y email verification
- El estado del servidor se gestiona con **TanStack Query**: cache, revalidación y mutations
- Todos los calls HTTP pasan por una capa de servicios (`services/`) que encapsula la comunicación con la API y adjunta el session token de Clerk en el header `Authorization`

**Deploy:** Vercel. Detecta automáticamente `apps/frontend` en el monorepo.

### API — `apps/api`

Servidor HTTP construido con **Express**. Es el único punto de acceso a la base de datos y a servicios externos como Stripe.

- Arquitectura en capas: routes → controllers → services → repositories
- Validación de requests con **Zod** aplicado explícitamente en cada controller
- Autenticación: la API verifica el JWT de sesión emitido por **Clerk** (via `@clerk/backend` + JWKS) en cada request. La API no emite ni refresca tokens — eso es responsabilidad de Clerk
- El primer request autenticado de un usuario nuevo crea su fila en la tabla local `User` (lazy upsert por `clerkUserId`); las siguientes la reusan
- Los webhooks de Stripe llegan aquí y se verifican con la firma del payload antes de procesarse

**Deploy:** Railway. Detecta `apps/api` y expone el servidor en un dominio propio.

---

## Paquetes internos

### `packages/database`

Contiene el **schema de Prisma** y exporta el cliente tipado. Ambas apps lo importan como dependencia interna — el schema es la única fuente de verdad del modelo de datos.

### `packages/types`

DTOs de request y response compartidos entre frontend y API. Garantiza que un cambio de contrato falle en build en ambas apps antes de llegar a producción.

### `packages/config`

Configuraciones base de TypeScript y ESLint extendidas por cada app. Mantiene consistencia de tooling sin duplicar archivos.

---

## Servicios externos

### Supabase — base de datos

PostgreSQL hosteado con **Row Level Security** habilitado. Aunque Prisma ya filtra por usuario en las queries, RLS añade una segunda capa de protección a nivel de base de datos.

### Stripe — pagos

Integrado únicamente en la API. El frontend nunca toca la clave secreta de Stripe — solo recibe el `clientSecret` del PaymentIntent y lo pasa al SDK de Stripe en el browser para completar el pago.

### Clerk — identidad

Identity provider. Maneja signup, login, sesiones, password reset, email verification, y todos los providers OAuth (Google y otros configurables desde el dashboard). El frontend integra con `@clerk/nextjs`; la API verifica los tokens de sesión con `@clerk/backend`. La tabla `User` en nuestra base de datos guarda únicamente datos de perfil propios del negocio (`role`, denormalización de `email`/`name`) y se enlaza con Clerk por `clerkUserId`.

**Regla de la arquitectura — única excepción:** el frontend habla directo con Clerk (no a través de la API) porque es un servicio de identidad externo, igual que NextAuth hablaría con Google directamente. Para todo lo demás (datos de negocio, Stripe, etc.), la API sigue siendo el único punto de acceso.

---

## Flujo principal — compra

```
Usuario en checkout
  → Frontend crea una orden         POST /orders           (API)
  → API crea la orden en DB
  → API crea un PaymentIntent        (Stripe)
  → API devuelve el clientSecret     → Frontend
  → Frontend completa el pago        (Stripe SDK en browser)
  → Stripe notifica el resultado     POST /webhooks/stripe  (API)
  → API actualiza el estado de la orden en DB
  → Frontend revalida la orden con TanStack Query
```

---

## Flujo de autenticación

```
Signup / Login (email-password o Google OAuth)
  → Frontend usa <SignIn /> / <SignUp /> de @clerk/nextjs
  → Clerk maneja todo el flow (incluyendo OAuth redirect/callback) y crea la sesión
  → Frontend obtiene un session token con auth().getToken() / useAuth().getToken()
  → Cada request a la API adjunta           Authorization: Bearer <clerk_session_token>
  → API verifica el token con @clerk/backend (JWKS)
  → Primer request: lazy upsert en tabla User local (clerkUserId → cuid local)
  → Subsiguientes: requireAuth busca el User local por clerkUserId
  → clerkMiddleware bloquea rutas protegidas en el frontend si no hay sesión

Refresh de token: lo maneja Clerk SDK de forma transparente — la API no lo ve.
```

---

## Seguridad

- **CORS** configurado con `cors` para aceptar únicamente el dominio del frontend
- **Rate limiting** en los endpoints de autenticación con `express-rate-limit`
- **Helmet** para cabeceras HTTP de seguridad
- **Secrets** nunca en el código — `.env.local` en `.gitignore`, `.env.example` en el repo con valores vacíos
- **Stripe webhook** verificado con firma antes de procesar cualquier evento
- **Precios** almacenados en céntimos (enteros) para evitar errores de coma flotante

---

## CI/CD

Turborepo detecta qué app cambió en cada push y ejecuta solo los pipelines afectados.

```
Push a main
  → Turborepo analiza el diff
  → Si cambió apps/frontend   →  build + deploy en Vercel
  → Si cambió apps/api        →  build + deploy en Railway
  → Si cambió packages/*      →  build de ambas apps
```

---

## Entornos

| Entorno | Frontend | API | Base de datos |
|---|---|---|---|
| Local | `localhost:3000` | `localhost:3001` | Supabase dev |
| Preview | Vercel preview URL | — | Supabase dev |
| Production | Dominio propio en Vercel | Dominio en Railway | Supabase prod |
