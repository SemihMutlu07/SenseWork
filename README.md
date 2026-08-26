# SenseWork

Next.js user management app with JWT auth, paginated dashboard, and Excel bulk upload.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Forms / data | React Hook Form, TanStack Query, Zod |
| ORM / DB | Prisma + PostgreSQL |
| Auth | JWT (`jose`) in httpOnly cookies |
| Excel | SheetJS (`xlsx`) |
| Packaging | Docker + Docker Compose |

## Features

- Login at `/` with JWT cookie auth
- Middleware redirects authenticated users to `/dashboard` and expired/missing tokens back to `/`
- `/dashboard` — paginated user list with age filters via URL params (`page`, `ageMin`, `ageMax`)
- `/dashboard/add` — create a user (React Hook Form + Zod)
- `/dashboard/addMany` — Excel bulk import with row-level Zod validation and all-or-nothing transactions
- `/dashboard/[userId]` — user detail view
- Seeded default admin user: **admin / admin**

## Excel format

| name | surname | email | age | password |
| --- | --- | --- | --- | --- |
| John | Doe | johndoe@example.com | 25 | 123456 |

On any validation or duplicate error, the API returns the failing row number(s) and writes **no** users.

## Local setup

Requirements: Node.js 20+, pnpm 11, PostgreSQL 16+.

```bash
cp .env.example .env
# edit DATABASE_URL / JWT_SECRET if needed

pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `admin` / `admin`.

## Docker

```bash
docker compose up --build
```

App: [http://localhost:3000](http://localhost:3000)  
Postgres: `localhost:5432` (`sensework` / `sensework` / db `sensework`)

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Create/apply migrations (dev) |
| `pnpm db:migrate:deploy` | Apply migrations (prod) |
| `pnpm db:seed` | Seed default admin user |
| `pnpm db:studio` | Prisma Studio |

## Project structure

```
prisma/                 # schema, migrations, seed
src/
  app/                  # routes + API handlers
  components/           # UI forms and tables
  lib/                  # prisma, auth, zod schemas
  middleware.ts         # JWT redirects
docker/                 # container entrypoint
Dockerfile
docker-compose.yml
```

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT cookies |

## Deploy notes

Vercel publication will be added next. For Vercel you will need a hosted Postgres instance and the env vars above.
