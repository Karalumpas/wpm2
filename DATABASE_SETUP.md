# Database Setup

This project uses a Dockerized PostgreSQL database by default.

## Overview

- Standard local DB: Docker PostgreSQL
- Drizzle ORM for schema and migrations
- Seed script for sample data and defaults

## Setup

1) Start Docker services

```bash
npm run docker:up
```

2) Run database migrations

```bash
npm run db:migrate
```

3) Seed database (optional but recommended)

```bash
npm run db:seed
```

4) Start development server

```bash
npm run dev
```

## Connection Details (Docker)

- Host: `localhost`
- Port: `5432`
- Database: `wpm2`
- User: `postgres`
- Password: `postgres`
- URL: `postgresql://postgres:postgres@localhost:5432/wpm2`

## Test Credentials

After seeding you can log in with:

- Email: `admin@wpm2.com`
- Password: `admin123`

## Main Tables

- `users` – Accounts and authentication
- `settings` – User preferences and currency settings
- `shops` – WooCommerce connections
- `products` – Product catalog
- `product_variants` – Product variations
- `categories` – Product categories
- `brands` – Product brands
- `media_files` – Uploaded media and PhotoPrism links

## Useful Commands

```bash
# Docker lifecycle
npm run docker:up
npm run docker:down

# Drizzle tools
npm run db:generate   # create new migration
npm run db:migrate    # apply migrations
npm run db:push       # push schema changes (dev)
npm run db:studio     # open Drizzle Studio
npm run db:seed       # seed sample data

# psql inside the container
docker exec -it wpm2-postgres psql -U postgres -d wpm2
```

## Migrate From External PostgreSQL

Export from an external DB and import into Docker:

```bash
# Export (example)
pg_dump -h 192.168.0.180 -U your_user -d wpm2 --data-only --inserts > backup.sql

# Import into Docker DB
docker exec -i wpm2-postgres psql -U postgres -d wpm2 < backup.sql
```

## Environment Variable

`.env.local` should include:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpm2
```

## Verify

1) Visit `http://localhost:3000/api/health` – should return `{ "status": "ok" }`
2) Log in with the test credentials
3) Open `/settings` to configure currency
4) Open `/products` to verify product listing and formatting

