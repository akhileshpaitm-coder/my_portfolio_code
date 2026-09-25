# Deployment Guide

Run through this checklist before every production release. Migrations are
database-first: **apply migrations before shipping code that depends on the
new collections** (new code + missing collection = runtime 500s; old code +
new collection = harmless).

## 1. Database migrations

The database is **MongoDB** (Atlas or self-hosted), accessed through
**TypeORM** (`src/lib/db.ts` + `src/lib/entities/`). Schema is managed by the
migration runner (`scripts/migrate.mjs`), which applies every script in
`scripts/migrations/` that hasn't been applied yet — tracked in the
`_migrations` collection, in filename order, each exactly once. It reads
`MONGODB_URI` / `DB_NAME` from `.env.local` (dev) or `.env` (production) —
no `mongosh` required.

```bash
npm run db:migrate:status   # preview: shows applied ✔ / pending ○ scripts
npm run db:migrate          # apply pending migrations
```

All scripts are idempotent — safe to re-run, and they never overwrite content
edited through the dashboard (seeds insert only when missing). If a script
fails, the runner stops, reports the failing file, and completed migrations
are skipped on the next run.

One migration per collection, in this order:

| File | Collection(s) |
| --- | --- |
| `001_users.mjs` | `users` (+ `counters`) — seeds the admin account |
| `002_skills.mjs` | `skills` + seed |
| `003_projects.mjs` | `projects` + seed |
| `004_expertise.mjs` | `expertise` + seed |
| `005_about.mjs` | `about_paragraphs`, `core_values` + seed |
| `006_site_settings.mjs` | `site_settings` + seed |
| `007_contact.mjs` | `contact_messages`, `contact_replies` |

Numeric ids are allocated by the `counters` collection (see `nextId()` in
`src/lib/db.ts`) — the equivalent of the old SQL `AUTO_INCREMENT`.

Verify afterwards:

```javascript
// In mongosh against the app database (portfolio_db):
show collections               // expect: users, counters, projects,
                               // contact_messages, contact_replies, skills,
                               // expertise, about_paragraphs, core_values,
                               // site_settings, _migrations
db.site_settings.countDocuments()   // expect ≥ 15
db._migrations.find()               // one row per applied script
```

## 2. Environment variables

Ensure the production environment defines:

- `MONGODB_URI` — full connection string (e.g. the Atlas `mongodb+srv://…`
  or `mongodb://…` URI), `DB_NAME` — database name (`portfolio_db`)
- `AUTH_SECRET`, `AUTH_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`
- `CONTACT_EMAIL` (recipient for contact-form notifications)
- `NEXT_PUBLIC_CALENDLY_URL` — Calendly event URL for the "Book a Meeting"
  popup (client-safe; defaults to `https://calendly.com/akhileshpaitm/30min`)

> **Atlas networking:** the deploying host's IP must be in the cluster's
> Network Access list (or use `0.0.0.0/0` for hosts with dynamic IPs), and the
> database user must exist with read/write on the database. Connection errors
> like `tlsv1 alert internal error` usually mean the IP isn't whitelisted.

## 3. Build & start

```bash
npm ci
npm run db:migrate
npm run build
npm run start        # or pm2 restart <app>
```

## 4. Post-deploy verification

- [ ] Homepage renders — Hero stats, About, Skills, Expertise, Projects, Technologies, Contact, Footer all populated
- [ ] Log in at `/login` → `/dashboard` loads with the unread-messages badge
- [ ] `/dashboard/settings` shows the **Site Settings** form; change the Hero badge, save, confirm it appears on the homepage, then change it back
- [ ] Submit a test message via `/contact` → appears in `/dashboard/messages`; reply to it → arrives threaded in the same email conversation
- [ ] Confirm the contact reply email lands in the expected inbox

## Rollback

Code: redeploy the previous build. Database changes can stay in place — all
migrations are additive (`createCollection` is a no-op if it exists, seeds
insert only when missing), so older code that doesn't reference the new
collections keeps working. The runner never re-executes an already-applied
script, so no double-seeding.
