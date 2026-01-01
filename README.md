# FlagTest

Foundation scaffold for FlagTest, a Next.js + Postgres product for running gamified tests and surfacing non-clinical signals.

## Stack
- Next.js (App Router) + TypeScript
- Prisma ORM with PostgreSQL
- Zod for validation
- Argon2 for password hashing
- CSS Modules for light styling

## Getting started
1. Copy `.env.example` to `.env` and update values.
2. Start Postgres (optional helper):
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client and create migrations (create-only keeps database clean):
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Apply migrations and seed data:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
6. Run the app:
   ```bash
   npm run dev
   ```
   - Marketing surface: `/`
   - App surface (auth required): `/app`
  - Runner surface (fullscreen): `/t`

Seeded admin credentials: `admin@example.com` / `changeme123`.

## Auth foundation
- Email/password registration and login for adults.
- Session cookies backed by the `AuthSession` table.
- Server helpers in `src/auth/session.ts`: `requireUser`, `getUser`, `signIn`, `signOut`.

## Data model
Prisma models are defined in `prisma/schema.prisma` with a starter migration and seed covering:
- Users, AuthSession
- Organization, OrgMember, Evaluation
- StudentRecord, TestDefinition, TestSession, Answer, Score
- Group, GroupMember

## Survey engine foundation
- Test definitions validated via `src/survey/schema.ts` (versioned, currently v1).
- Widget/style registry in `src/survey/registry.ts`.
- Example widget: `scenario_choice` (`src/survey/widgets/scenario-choice.tsx`).
- Style registry with default `classic` style (`src/survey/styles/classic.module.css`).

Add new widgets/styles by following the README files in their respective directories.
