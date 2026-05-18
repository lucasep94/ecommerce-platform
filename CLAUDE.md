# E-commerce — Visión general de arquitectura

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
- Autenticación gestionada por **NextAuth v5**, que almacena el JWT en una cookie httpOnly cifrada
- El estado del servidor se gestiona con **TanStack Query**: cache, revalidación y mutations
- Todos los calls HTTP pasan por una capa de servicios (`services/`) que encapsula la comunicación con la API

**Deploy:** Vercel. Detecta automáticamente `apps/frontend` en el monorepo.

### API — `apps/api`

Servidor HTTP construido con **Express**. Es el único punto de acceso a la base de datos y a servicios externos como Stripe.

- Arquitectura en capas: routes → controllers → services → repositories
- Validación de requests con **Zod** aplicado explícitamente en cada controller
- Autenticación stateless con **JWT** (access token de 15 min + refresh token de 7 días)
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
Login
  → Frontend envía credenciales      POST /auth/login    (API)
  → API valida, devuelve tokens      { accessToken, refreshToken }
  → NextAuth guarda tokens en cookie httpOnly cifrada
  → Cada request adjunta             Authorization: Bearer <accessToken>
  → Al expirar el access token       POST /auth/refresh  (API)
  → Middleware de Next.js bloquea rutas protegidas si no hay sesión válida
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
