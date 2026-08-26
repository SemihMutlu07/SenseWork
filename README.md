# SenseWork

A [Next.js](https://nextjs.org) web application (App Router, TypeScript, Tailwind CSS). Work in progress — currently a fresh scaffold awaiting its first feature build-out.

## Tech Stack

| Layer      | Choice                                |
| ---------- | ------------------------------------- |
| Framework  | Next.js 16 (App Router)               |
| UI         | React 19                               |
| Language   | TypeScript 5                           |
| Styling    | Tailwind CSS 4                          |
| Linting    | ESLint 9 + `eslint-config-next`        |
| Package mgr| pnpm 11 (`packageManager` pinned)      |

## Project Structure

```
.
├── public/            # Static assets (logos, icons)
├── src/
│   └── app/           # App Router pages & layouts
│       ├── globals.css    # Tailwind entry + theme tokens
│       ├── layout.tsx     # Root layout (Geist fonts, metadata)
│       └── page.tsx       # Home page
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-workspace.yaml     # Build allowlist for native deps
├── postcss.config.mjs
└── tsconfig.json
```

## Getting Started

Requirements: Node.js 20+, pnpm 11.

```bash
pnpm install     # install dependencies
pnpm dev         # start dev server → http://localhost:3000
```

The home page is served from `src/app/page.tsx` and hot-reloads as you edit it.

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Start the development server   |
| `pnpm build`   | Production build               |
| `pnpm start`   | Serve the production build     |
| `pnpm lint`    | Lint with ESLint               |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — features and API
- [Learn Next.js](https://nextjs.org/learn) — interactive tutorial
- [Tailwind CSS v4](https://tailwindcss.com/docs) — styling utilities

## Deploy

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app) — see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.