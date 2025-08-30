# WooCommerce Product Manager v2

Production-ready Next.js application for managing WooCommerce products with centralized media storage.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript (strict mode)
- PostgreSQL + Drizzle ORM (migrations)
- NextAuth for authentication
- Tailwind CSS v4
- Vitest for tests
- ESLint + Prettier
- MinIO (S3-compatible object storage)
- PhotoPrism (AI-powered photo management)

## Requirements

- Node.js 18+
- Docker + Docker Compose
- Git
- At least 4 GB RAM for PhotoPrism

## Quick Start

1) Install dependencies

```bash
git clone <repository-url>
cd wpm2
npm install
```

2) Start required services (PostgreSQL, MinIO, PhotoPrism)

```bash
npm run docker:up
```

3) Apply database migrations

```bash
npm run db:migrate
```

4) Configure environment

Create `.env.local` with at least:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpm2

# NextAuth
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Encryption (32 chars)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# PhotoPrism (Photo Management)
PHOTOPRISM_URL=http://localhost:2342
PHOTOPRISM_USER=admin
PHOTOPRISM_PASSWORD=insecure
```

5) Start the app

```bash
npm run dev
```

## URLs

- App: http://localhost:3000
- API Health: http://localhost:3000/api/health
- Services Health: http://localhost:3000/api/health/services
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
- PhotoPrism: http://localhost:2342 (admin / insecure)

## Testing

```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage
```

## API Overview

- `GET /api/products` – Products with pagination and filters
- `GET /api/products/filters` – Available filter values
- `GET /api/brands` and `GET /api/categories` – Taxonomies
- `POST /api/uploads` – Upload media to MinIO
- `GET /api/media` and `DELETE /api/media` – Manage media
- `GET/POST /api/photos` and `GET /api/photos/{uid}` – PhotoPrism
- `GET /api/albums` and `POST /api/albums` – Albums
- `GET /api/health` and `GET /api/health/services` – Health checks

## Project Structure

```
src/
  app/
    api/
    page.tsx
  db/
    index.ts
    schema.ts
  lib/
    auth.ts
    auth-config.ts
    validations.ts
drizzle/
  migrations/
tests/
  setup.ts
```

## Scripts

```bash
# App
npm run dev
npm run build
npm run start

# Database
npm run db:generate   # Generate new migrations
npm run db:migrate    # Apply migrations
npm run db:push       # Push schema changes (dev)
npm run db:studio     # Open Drizzle Studio
npm run db:seed       # Seed with test data

# Docker
npm run docker:up
npm run docker:down
npm run docker:minio
npm run docker:photoprism
npm run docker:services
npm run docker:logs

# Quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run type-check
```

## Security

- Passwords hashed with bcryptjs
- Input validation with Zod
- SQL injection protection via Drizzle
- Server-side sessions (NextAuth)
- Environment variable validation

## Media Features (MinIO + PhotoPrism)

- Centralized object storage for product images (MinIO)
- AI-powered photo indexing, search, and albums (PhotoPrism)
- Featured and gallery images for products
- RESTful API endpoints for media operations

More details: see `PHOTOPRISM_MINIO_INTEGRATION.md`.

