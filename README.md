# SenseWork

Next.js user-management case study: JWT auth, paginated dashboard, single-user create, and atomic Excel bulk import.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| ORM / DB | Prisma 6 + PostgreSQL |
| Auth | JWT (`jose`) in HttpOnly cookie |
| Validation | Zod |
| Forms / data | React Hook Form + TanStack Query |
| Excel | `xlsx` |
| Styling | Tailwind CSS 4 |
| Tests | Vitest |
| Packaging | Docker Compose (app + Postgres) |

## Quick start (local)

Requirements: Node.js 20+, pnpm 11, PostgreSQL 16.

```bash
cp .env.example .env
# edit DATABASE_URL / JWT_SECRET if needed

pnpm install
pnpm db:migrate   # creates schema
pnpm db:seed      # admin / admin (hashed)
pnpm dev          # http://localhost:3000
```

Default seeded credentials:

- **Email:** `admin`
- **Password:** `admin`

## Docker

```bash
docker compose up --build
```

App: http://localhost:3000  
Postgres: `localhost:5432` (`sensework` / `sensework`)

## Routes

| Path | Description |
| --- | --- |
| `/` | Login |
| `/dashboard` | User list (`?page=&minAge=&maxAge=`) |
| `/dashboard/add` | Add user |
| `/dashboard/addMany` | Excel bulk import |
| `/dashboard/[userId]` | User detail |

## Excel import

Required headers (mapped to DB fields):

| Excel | Database |
| --- | --- |
| `name` | `firstName` |
| `surname` | `lastName` |
| `email` | `email` |
| `age` | `age` |
| `password` | `password` (hashed) |

Import is **all-or-nothing**. Validation failures return:

```json
{
  "code": "INVALID_IMPORT",
  "errors": [{ "row": 14, "field": "email", "message": "Invalid email address" }]
}
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm db:migrate` | Prisma migrate (dev) |
| `pnpm db:seed` | Seed admin user |

## Environment

See `.env.example`. Never commit real secrets. `.env` is gitignored.
