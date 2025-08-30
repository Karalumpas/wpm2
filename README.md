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

## 📋 Forudsætninger

- Node.js 18+
- Docker og Docker Compose
- Git

## 🛠️ Installation og Opsætning

### 1. Klon og installer dependencies

```bash
git clone <repository-url>
cd wpm2
npm install
```

### 2. Start PostgreSQL database

```bash
# Start database container
npm run docker:up

# Verificer at containeren kører
docker ps
```

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
```

### 5. Start udviklingsserveren

```bash
npm run dev
```

Applikationen er nu tilgængelig på [http://localhost:3000](http://localhost:3000)

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

# Docker
npm run docker:up       # Start PostgreSQL
npm run docker:down     # Stop PostgreSQL

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

## 📝 Næste Skridt

Etape 1 er nu komplet! Næste etape vil indeholde:

- UI komponenter til login/registrering
- Dashboard med produkthåndtering
- WooCommerce API integration
- Avanceret testing og monitoring
