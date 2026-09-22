This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font) from Vercel.

## Database

MongoDB, accessed through **TypeORM** (`src/lib/db.ts`, entities in
`src/lib/entities/`). Set `MONGODB_URI` and `DB_NAME` in `.env.local`, then
create the collections (one migration script per collection, tracked in the
`_migrations` collection):

```bash
npm run db:migrate:status   # preview applied/pending scripts
npm run db:migrate          # apply pending migrations
```

Seeds (admin user, skills, projects, site settings…) are included in the
migrations and are inserted only when missing.

## Deployment

Before every production release, run through the checklist in
[DEPLOYMENT.md](./DEPLOYMENT.md) — database migrations (apply **before**
shipping new code), environment variables, build steps, and post-deploy
verification.
