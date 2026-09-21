# Deployment Guide

Run through this checklist before every production release. Migrations are
database-first: **apply SQL before shipping code that depends on the new
tables/columns** (new code + missing table = runtime 500s; old code + new
table = harmless).

## 1. Database migrations

Run the migration runner on the production host — it applies every script in
`scripts/db/` that hasn't been applied yet (tracked in a `schema_migrations`
table), in the right order, with `schema.sql` first. Uses the app's `DB_*`
environment variables or `.env` — no `mysql` CLI required.

```bash
npm run db:migrate:status   # preview: shows applied ✔ / pending ○ scripts
npm run db:migrate          # apply pending migrations
```

All scripts are idempotent — safe to re-run, and they never overwrite
content edited through the dashboard. If a script fails, the runner stops,
reports the failing file, and completed migrations are skipped on the next run.

> **Note:** `email-threading-migration.sql` uses `ADD COLUMN IF NOT EXISTS`
> (MariaDB / MySQL 8+). On older MySQL, run the two `ALTER TABLE` statements
> manually once, then delete the file from `scripts/db/` **on the server**
> (or just let the runner mark it applied — the seed `INSERT` is guarded).

Prefer manual control? The equivalent one-by-one commands:

```bash
mysql -u <user> -p <scripts/db/schema.sql                     # base schema (users)
mysql -u <user> -p <scripts/db/projects-migration.sql         # projects
mysql -u <user> -p <scripts/db/contact-migration.sql          # contact_messages
mysql -u <user> -p <scripts/db/contact-replies-migration.sql  # contact_replies (FK → contact_messages)
mysql -u <user> -p <scripts/db/skills-migration.sql           # skills + seed
mysql -u <user> -p <scripts/db/expertise-migration.sql        # expertise + seed
mysql -u <user> -p <scripts/db/about-migration.sql            # about_paragraphs + core_values + seed
mysql -u <user> -p <scripts/db/email-threading-migration.sql  # email_message_id columns
mysql -u <user> -p <scripts/db/site-settings-migration.sql    # site_settings + seed  ← added this release
mysql -u <user> -p <scripts/db/booking-settings-migration.sql # booking_* settings keys  ← added this release
```

(`npm run db:migrate` applies all of these automatically — see step 1 above.)

Verify afterwards:

```sql
USE portfolio_db;
SHOW TABLES;                      -- expect: users, projects, contact_messages,
                                  -- contact_replies, skills, expertise,
                                  -- about_paragraphs, core_values,
                                  -- site_settings, schema_migrations
SELECT COUNT(*) FROM site_settings;   -- expect ≥ 15
SELECT * FROM schema_migrations;      -- one row per applied script
```

## 2. Environment variables

Ensure the production environment defines:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `AUTH_SECRET`, `AUTH_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`
- `CONTACT_EMAIL` (recipient for contact-form notifications)
- `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` — service account for the meeting
  booking section (optional; the section hides itself when unset or when
  `booking_calendar_id` in Site Settings is empty). The target calendar must be
  shared with the service account email with **Make changes to events** permission.

## 3. Build & start

```bash
npm ci
npm run build
npm run start        # or pm2 restart <app>
```

## 4. Post-deploy verification

- [ ] Homepage renders — Hero stats, About, Skills, Expertise, Projects, Technologies, Contact, Footer all populated
- [ ] Log in at `/login` → `/dashboard` loads with the unread-messages badge
- [ ] `/dashboard/settings` shows the **Site Settings** form; change the Hero badge, save, confirm it appears on the homepage, then change it back
- [ ] Submit a test message via `/contact` → appears in `/dashboard/messages`; reply to it → arrives threaded in the same email conversation
- [ ] Confirm the contact reply email lands in the expected inbox
- [ ] If booking is configured: the "Let's Talk" section shows on the homepage; pick a slot and submit — the meeting appears on the Google Calendar and the visitor receives the invite

## Rollback

Code: redeploy the previous build. Database changes can stay in place — all
migrations are additive (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN`), so
older code that doesn't reference the new tables keeps working. The runner
ever re-executes an already-applied script, so no double-seeding.
