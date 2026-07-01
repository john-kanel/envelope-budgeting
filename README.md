# Envelope Budgeting

Envelope Budgeting is a mobile-friendly personal finance app focused on:
- Expense tracking
- Custom categories
- Tax-deductible expense tagging
- Monthly category budgets
- Budget vs actual and month-over-month insights

## Stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (Railway)
- JWT cookie sessions

## Core Features

- **Individual user accounts** (email/password)
- **Expenses**: add, edit, delete, filter by month/category/tax-deductible
- **Categories**: create, rename, activate/deactivate, delete (if unused)
- **Tax deductible flag** on every expense
- **Budgets**: monthly category budgets with variance against actuals
- **Insights**: month-over-month totals and category performance
- **CSV export** for tax-deductible expenses

## Railway Setup

1. Create a **PostgreSQL** database in your Railway project.
2. Open your **web service → Variables**.
3. Add a reference to Postgres `DATABASE_URL`.
4. Add `JWT_SECRET` (long random string).
5. Deploy from GitHub — on startup the app runs `prisma db push` to create/update tables.

Optional: seed demo data from Railway shell:

```bash
npm run db:seed
```

Demo login:
- Email: `demo@envelope.local`
- Password: `password123`

## Local (optional)

Requires a Postgres `DATABASE_URL` in `.env`, then:

```bash
npm install
npm run db:push
npm run dev
```

## Scripts

- `npm run dev` - start local server
- `npm run build` - production build
- `npm run lint` - lint checks
- `npm run db:push` - sync Prisma schema to database
- `npm run db:seed` - insert demo user and categories
