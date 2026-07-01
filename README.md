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
- Prisma ORM + SQLite
- JWT cookie sessions

## Core Features

- **Individual user accounts** (email/password)
- **Expenses**: add, edit, delete, filter by month/category/tax-deductible
- **Categories**: create, rename, activate/deactivate, delete (if unused)
- **Tax deductible flag** on every expense
- **Budgets**: monthly category budgets with variance against actuals
- **Insights**: month-over-month totals and category performance
- **CSV export** for tax-deductible expenses

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.example .env
```

3. Create/update database schema:

```bash
npm run db:push
```

4. (Optional) seed demo account:

```bash
npm run db:seed
```

Demo login:
- Email: `demo@envelope.local`
- Password: `password123`

5. Start app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local server
- `npm run build` - production build
- `npm run lint` - lint checks
- `npm run db:push` - sync Prisma schema to database
- `npm run db:seed` - insert demo user and categories
