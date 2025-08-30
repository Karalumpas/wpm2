# WooCommerce Product Manager v2

En produktionsklar Next.js applikation til håndtering af WooCommerce produkter.

## 🚀 Teknisk Stack

- **Next.js 14** med App Router
- **TypeScript** i strict mode
- **PostgreSQL** database
- **Drizzle ORM** med migreringer
- **NextAuth** til autentificering
- **Tailwind CSS** til styling
- **Vitest** til testing
- **ESLint + Prettier** til kodekvalitet
- **MinIO** object storage (S3-compatible)
- **PhotoPrism** AI-powered foto management

## 📋 Forudsætninger

- Node.js 18+
- Docker og Docker Compose
- Git
- Mindst 4GB RAM til PhotoPrism

## 🛠️ Installation og Opsætning

### 1. Klon og installer dependencies

```bash
git clone <repository-url>
cd wpm2
npm install
```

### 2. Start PostgreSQL database

```bash
# Start alle services (PostgreSQL, MinIO, PhotoPrism)
npm run docker:up

# Verificer at containerne kører
docker compose ps
```

**Services tilgængelige:**

- PostgreSQL: localhost:5432
- MinIO: localhost:9000 (admin: localhost:9001)
- PhotoPrism: localhost:2342

### 3. Kør database migreringer

```bash
# Generer migreringer (allerede gjort)
npm run db:generate

# Kør migreringer mod databasen
npm run db:migrate
```

### 4. Miljøvariabler

Kopier `.env.local` og tilpas efter behov:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpm2

# NextAuth
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Encryption
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

### 5. Start udviklingsserveren

```bash
npm run dev
```

## 🔍 Service Adresser

**Applikation:**

- http://localhost:3000 - Hovedapplikation
- http://localhost:3000/api/health - API healthcheck
- http://localhost:3000/api/health/services - Services status

**Object Storage (MinIO):**

- http://localhost:9000 - MinIO API
- http://localhost:9001 - MinIO Admin Console
- Credentials: minioadmin / minioadmin123

**Photo Management (PhotoPrism):**

- http://localhost:2342 - PhotoPrism Interface
- Credentials: admin / insecure

## 🧪 Testing

```bash
# Kør alle tests
npm test

# Kør tests i watch mode
npm run test:watch

# Kør tests med coverage
npm run test:coverage
```

## 📊 Database Administration

```bash
# Åbn Drizzle Studio (database browser)
npm run db:studio
```

## 🔐 Autentificering Endpoints

### Registrer ny bruger

```bash
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

### Login

```bash
POST /api/auth/signin
# Eller brug NextAuth login page: /api/auth/signin
```

### Logout

```bash
POST /api/auth/signout
```

## 🏥 Healthcheck

```bash
GET /api/health
```

Svarer med:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": "ok",
  "timestamp": "2024-..."
}
```

## 📁 Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── register/
│   │   └── health/
│   └── page.tsx
├── db/
│   ├── index.ts          # Database forbindelse
│   └── schema.ts         # Database schema
└── lib/
    ├── auth.ts           # Password utilities
    ├── auth-config.ts    # NextAuth konfiguration
    └── validations.ts    # Zod schemas

drizzle/
└── migrations/           # Database migreringer

tests/
├── setup.ts
├── auth.test.ts          # Password utility tests
├── api.test.ts           # API endpoint tests
└── health.test.ts        # Healthcheck tests
```

## 🧭 Navigation

Applikationen bruger nu kun MainLayout-komponentens indbyggede sidebar til navigation. Den tidligere Navigation-komponent er fjernet.

## 🔧 Udvikling Scripts

```bash
# Udvikling
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generer nye migreringer
npm run db:migrate       # Kør migreringer
npm run db:push         # Push schema changes (development)
npm run db:studio       # Åbn database browser

# Docker services
npm run docker:up         # Start alle services
npm run docker:down       # Stop alle services
npm run docker:minio      # Start kun MinIO
npm run docker:photoprism # Start kun PhotoPrism
npm run docker:services   # Start MinIO + PhotoPrism
npm run docker:logs       # Vis logs fra alle services

# Kodekvalitet
npm run lint            # Check ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format with Prettier
npm run format:check    # Check Prettier formatting
npm run type-check      # TypeScript type checking
```

## ✅ Kvalitetssikring

Dette projekt har følgende kvalitetssikring:

1. **TypeScript strict mode** - Fuld type safety
2. **ESLint** - Kodekvalitet og konsistens
3. **Prettier** - Ensartet kodeformatering
4. **Husky** - Pre-commit hooks
5. **Vitest** - Unit og integration tests
6. **Zod** - Runtime input validering

## 🔒 Sikkerhed

- Passwords hashet med bcryptjs (12 rounds)
- Input validering med Zod
- SQL injection beskyttelse via Drizzle ORM
- Server-side sessions (ikke JWT)
- Environment variable validering

## 📝 Nye Features - PhotoPrism og MinIO

**Etape 2 - Media Management er komplet!**

### 🗂️ Media Library

- Upload billeder til MinIO object storage
- Administrer produkt billeder
- Automatisk file validering og sikkerhed

### 📸 Photo Management

- AI-powered foto organisering med PhotoPrism
- Automatisk indeksering og tagging
- Avanceret søgning og filtrering
- Album administration

### 🔗 Integration

- Produkter kan have featured images
- Media files koblet til brugere
- RESTful API til alle media operationer

**Næste etape vil indeholde:**

- UI komponenter til login/registrering forbedringer
- Avanceret produktbillede management
- Bulk upload funktionalitet
- CDN integration for optimeret performance
