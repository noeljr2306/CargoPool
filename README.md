# CargoPool

CargoPool is a multi-tenant cargo-pooling application for coordinating shared container space and shipment paperwork. Shippers submit shipment details; the server assigns each shipment to an available container, attempts a keyword-based HS-code classification, and exposes shipment and container status to the relevant users. Forwarders manage their containers and generate PDF manifests, while customs and transport users can review classifications and record tracking milestones.

> **Project status:** This repository contains an early-stage application and API implementation. Some generated tracking links point to a frontend route that is not implemented yet; see [Current scope and limitations](#current-scope-and-limitations).

## Contents

- [What it does](#what-it-does)
- [Roles and workflows](#roles-and-workflows)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Architecture and data](#architecture-and-data)
- [HTTP API](#http-api)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Database setup](#database-setup)
- [Tests and quality checks](#tests-and-quality-checks)
- [Current scope and limitations](#current-scope-and-limitations)

## What it does

- Separates organizations (tenants) and their users, with shipper and forwarder organization types.
- Authenticates users with email and password and issues signed JWTs for API requests.
- Lets shippers submit cargo descriptions, quantities, weight/volume, and destinations.
- Finds an open container with enough remaining capacity and attaches the shipment to it. If none fits, it creates a 100-unit container for a forwarder.
- Classifies product descriptions against seeded keyword-to-HS-code mappings. Shipments without a match can be reviewed and manually classified.
- Shows shippers their own shipments, the assigned container's fill percentage, container status, and tracking-event history.
- Lets forwarders view their containers, close open containers, and generate a PDF manifest after closing a container.
- Produces a QR-code PNG with a container tracking URL when a manifest is generated.
- Lets transport personnel or forwarders record container milestones. Recording `DELIVERED` also marks the container delivered.
- Applies PostgreSQL row-level security (RLS) to tenant-scoped tables, with a separate database client reserved for explicitly cross-tenant operations.

## Roles and workflows

| Role | Main capabilities |
| --- | --- |
| `SHIPPER` | Register as a shipper, create and list own shipments, and view tracking for own shipments. |
| `FORWARDER` | Register as a forwarder, view own containers, close containers, review unclassified shipments, assign HS codes, generate manifests, and record tracking milestones. |
| `CUSTOMS_AGENT` | Review shipments that have no HS code and assign an HS code. |
| `TRANSPORT_PERSONNEL` | Record a milestone against a container ID. |

Registration creates a tenant and its first user, and supports only `SHIPPER` and `FORWARDER` tenant types. Customs-agent and transport-personnel accounts must be provisioned separately; no such provisioning UI or seed workflow is included.

### Typical shipment lifecycle

1. A shipper registers or signs in and submits a shipment.
2. CargoPool searches open containers in ID order and selects the first with sufficient remaining capacity. If no suitable open container exists, it creates a container with capacity `100` and a departure deadline seven days later.
3. The product description is matched case-insensitively against the HS-code mapping keywords. The longest matching keyword wins. If no keyword matches, the shipment remains available for manual classification.
4. A forwarder closes the container and generates its manifest. Manifest generation creates a PDF listing the container and its shipments, and a QR-code PNG encoding the configured tracking URL.
5. Transport personnel or a forwarder records milestones (`DEPARTED`, `IN_TRANSIT`, `CUSTOMS_CLEARED`, `ARRIVED`, or `DELIVERED`). Shippers can view the container status and event history for their own shipment.

## Technology

### Client

- Next.js 16 App Router
- React 19
- Tailwind CSS 4 (via the Tailwind PostCSS plugin)
- ESLint 9 with the Next.js configuration
- JavaScript client components; the Next.js React Compiler is enabled

### Server

- Node.js with Express 4 (CommonJS)
- PostgreSQL
- Prisma ORM / Prisma Client 5
- JSON Web Tokens (`jsonwebtoken`) and bcrypt password hashing
- Helmet and CORS middleware
- PDFKit for manifest PDFs and `qrcode` for QR-code PNGs
- Jest 30 and Supertest for API/service tests

## Repository layout

```text
client/
  src/app/                 Next.js routes and role dashboards
  src/components/          Shared authentication and dashboard UI
  src/context/             Client-side authentication state
  src/lib/api.js           Fetch wrapper for the backend API
server/
  src/controllers/         HTTP request handlers
  src/lib/                 Prisma clients and tenant/RLS context
  src/middleware/          JWT authentication and role authorization
  src/routes/              Express route definitions
  src/services/            Pooling, HS classification, PDFs, and QR codes
  prisma/                  Prisma schema, migrations, and seed script
  tests/                   API, RBAC, RLS, and service tests
```

The frontend routes are `/login`, `/register`, `/dashboard/shipper`, `/dashboard/forwarder`, `/dashboard/customs`, and `/dashboard/transport`. The root route redirects to `/login`.

## Architecture and data

### Authentication and authorization

The API accepts bearer tokens in the `Authorization` header. JWTs include a user ID, tenant ID, and role, and expire after eight hours. Passwords are hashed with bcrypt. API middleware verifies the JWT and applies role checks on protected routes.

The browser stores the token and user record in `localStorage`; the shared API helper attaches the bearer token when one is supplied. Dashboard routes use client-side role guards.

### Tenant isolation

Tenant-scoped queries run inside `withTenant()`, which sets `app.current_tenant_id` locally for the transaction connection. PostgreSQL RLS policies use that value to restrict records. The transaction client passed to the callback must be used for queries in that scope.

`prismaAdmin` uses `ADMIN_DATABASE_URL` and is intended only for defined operations that inherently need cross-tenant access, such as matching a shipper's shipment to a forwarder's open container, building a manifest across shipper tenants, or recording/viewing tracking data. The regular `DATABASE_URL` connection should use a database role subject to RLS; the admin connection requires a role configured to bypass RLS.

### Main database entities

- **Tenant:** organization, typed as `SHIPPER` or `FORWARDER`.
- **User:** belongs to a tenant and has one of the four application roles.
- **Container:** belongs to a forwarder tenant and tracks capacity, fill, status, and optional departure deadline.
- **Shipment:** belongs to a shipper tenant, can be assigned to a container, and stores product, quantity, weight/volume, HS code, and destination.
- **HS-code mapping:** shared keyword, code, and description reference data.
- **Manifest:** generated-document metadata associated with a container.
- **Tracking event:** a milestone recorded for a container by a user.
- **Audit log:** records manual HS-code overrides.

The Prisma schema is in `server/prisma/schema.prisma`; migrations are in `server/prisma/migrations/`.

### Generated files

Manifest PDFs and QR-code PNGs are written under `server/uploads/manifests/` and `server/uploads/qrcodes/`. Express serves this directory at `/uploads`.

## HTTP API

The API listens on port `4000` by default. Except for health and authentication endpoints, routes below require a valid bearer token. Role names are the exact JWT role values.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Basic API health response. |
| `POST` | `/api/auth/register` | Public | Create a shipper/forwarder tenant and its initial user. |
| `POST` | `/api/auth/login` | Public | Authenticate and return a JWT and user. |
| `GET` | `/api/auth/me` | Authenticated | Return the current user and tenant. |
| `POST` | `/api/shipments` | `SHIPPER` | Create a shipment and assign it to a container. |
| `GET` | `/api/shipments` | `SHIPPER` | List the current shipper tenant's shipments. |
| `GET` | `/api/shipments/review` | `FORWARDER`, `CUSTOMS_AGENT` | List shipments without an HS code. |
| `PATCH` | `/api/shipments/:id/hs-code` | `FORWARDER`, `CUSTOMS_AGENT` | Manually assign an HS code and create an audit-log entry. |
| `GET` | `/api/containers` | `FORWARDER` | List the current forwarder's containers and shipments. |
| `GET` | `/api/containers/:id` | Authenticated | Get a container and its shipments. |
| `PATCH` | `/api/containers/:id/close` | `FORWARDER` | Close an open container. |
| `POST` | `/api/containers/:id/manifest` | `FORWARDER` | Generate a PDF manifest and container QR code. |
| `POST` | `/api/tracking/scan` | `TRANSPORT_PERSONNEL`, `FORWARDER` | Record a valid container milestone. |
| `GET` | `/api/shipments/:id/tracking` | `SHIPPER` | Get tracking for a shipment owned by the current tenant. |

JSON errors are returned as `{ "error": "..." }`; the API also exposes a basic `/health` response of `{ "status": "ok" }`.

## Getting started

### Prerequisites

- Node.js and npm
- A running PostgreSQL database
- Two database connection URLs: an application connection subject to RLS and a separate administrative connection with permission to bypass RLS

### Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Configure the environment

Create `server/.env` and `client/.env.local` as described in [Configuration](#configuration). Keep credentials and secrets out of version control.

### Prepare the database

From `server/`, generate the Prisma client, apply migrations, and optionally seed HS-code mappings:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

`prisma:migrate` uses Prisma's development migration flow. For a deployed environment, apply committed migrations with `npx prisma migrate deploy` instead.

### Run the application

Start the API and frontend in separate terminals:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

Open `http://localhost:3000`. The API health endpoint is `http://localhost:4000/health`.

## Configuration

| Variable | Used by | Required | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server / Prisma | Yes | PostgreSQL connection URL for normal application queries; use a database role subject to RLS. |
| `ADMIN_DATABASE_URL` | Server / Prisma admin client | Yes | PostgreSQL connection URL for explicitly cross-tenant operations; configure the role to bypass RLS. |
| `JWT_SECRET` | Server | Yes | Secret used to sign and verify JWTs. Supply a strong, private value. |
| `PORT` | Server | No | HTTP listening port; defaults to `4000`. |
| `NEXT_PUBLIC_API_URL` | Client build/runtime | Yes | Base URL for API requests, such as `http://localhost:4000`. Do not include a trailing slash. |
| `TRACKING_BASE_URL` | Server | No | Base URL encoded in generated container QR codes; defaults to `http://localhost:3000/track`. |

Example local values (replace the database URL placeholders and secret before running the server):

```dotenv
# server/.env
DATABASE_URL=your_application_database_url
ADMIN_DATABASE_URL=your_admin_database_url
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
TRACKING_BASE_URL=http://localhost:3000/track
```

```dotenv
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The server test setup loads `server/.env.test` before tests run. Configure it with test-database connection URLs and a test JWT secret. Do not point tests at a database containing data you need to keep: test helpers clear application tables.

## Database setup

The schema is PostgreSQL-specific and includes RLS policies that read `app.current_tenant_id`. The migrations create the schema and enable RLS on tenant-scoped tables; the shared `hs_code_mapping` table is intentionally not tenant-scoped. Ensure both database roles and their grants are configured appropriately before running the app.

The seed script inserts sample HS-code keyword mappings, including entries for hibiscus, shea butter, cocoa beans, textiles, leather bags, wooden crafts, groundnuts, palm oil, and ginger. It creates rows on each run; avoid rerunning it against the same database unless duplicate mappings are acceptable.

## Tests and quality checks

Run backend tests from `server/`:

```bash
npm test
```

The Jest suite uses a real database connection configured through `.env.test`. It covers authentication, role-based access, row-level security, and HS-code matching.

Run the frontend linter from `client/`:

```bash
npm run lint
```

Create a production frontend build from `client/`:

```bash
npm run build
```

## Current scope and limitations

- Container matching is a basic first-fit search over open containers in ID order; it does not optimize route, destination, shipping date, or carrier.
- New containers have a fixed capacity of `100`; the departure deadline is set to seven days after creation.
- HS classification is substring matching against local seed data, not an external customs service or authoritative tariff determination. Classification may need professional review.
- QR codes encode `${TRACKING_BASE_URL}/<container-id>`, but the frontend currently has no `/track/[id]` page or unauthenticated public-tracking endpoint. The available tracking API requires authentication and the shipper role.
- The transport dashboard accepts a pasted/scanned container ID and selected milestone; camera-based QR scanning is not implemented.
- Manifest files are stored on the server's local filesystem. Production deployments need durable/shared storage and an appropriate retention strategy.
- There is no interface for creating customs-agent or transport-personnel accounts.
- `server/src/routes/manifestRoutes.js` exists, but `server/src/app.js` does not mount it; manifest generation is currently exposed through the container route in `shipmentRoutes.js`.
