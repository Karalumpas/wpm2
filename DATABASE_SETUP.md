# Database Setup - Standardized Docker Configuration

## 🐳 Database Strategy

This application now uses **Docker PostgreSQL** as the standard database configuration instead of external databases.

## 📋 Setup Guide

### 1. Start Docker Database
```bash
npm run docker:up
```

### 2. Run Database Migrations
```bash
npm run db:migrate
```

### 3. Seed Database with Test Data
```bash
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔧 Database Configuration

**Docker PostgreSQL:**
- Host: `localhost`
- Port: `5432`
- Database: `wpm2`
- Username: `postgres`
- Password: `postgres`
- Connection String: `postgresql://postgres:postgres@localhost:5432/wpm2`

## 👤 Test Credentials

After running `npm run db:seed`, you can login with:
- **Email:** `admin@wpm2.com`
- **Password:** `admin123`

## 📊 Database Schema

The application includes these main tables:
- `users` - User accounts and authentication
- `settings` - User preferences and currency settings
- `shops` - WooCommerce shop connections
- `products` - Product catalog
- `product_variants` - Product variations
- `categories` - Product categories
- `brands` - Product brands

## 🛠️ Database Management Commands

```bash
# Start/stop Docker containers
npm run docker:up
npm run docker:down

# Database migrations
npm run db:generate  # Generate new migration
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema changes

# Database tools
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed with test data

# Connect directly to database
docker exec -it wpm2-postgres psql -U postgres -d wpm2
```

## 🔄 Migration from External Database

If you have data on an external PostgreSQL database that you want to migrate:

1. **Export data from external database:**
```bash
pg_dump -h 192.168.0.180 -U your_user -d wpm2 --data-only --inserts > backup.sql
```

2. **Import to Docker database:**
```bash
docker exec -i wpm2-postgres psql -U postgres -d wpm2 < backup.sql
```

## ⚙️ Environment Variables

The `.env.local` file is configured for Docker:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpm2
```

## 🎯 Currency & Settings Features

The application now supports:
- ✅ Multi-currency support (DKK, EUR, USD, GBP, SEK, NOK)
- ✅ Configurable currency position (left/right with/without space)
- ✅ User-specific settings storage
- ✅ Default settings (DKK currency) for new users
- ✅ Settings management UI in `/settings` page

## 🔍 Verification

Test that everything works:
1. Visit `http://localhost:3000/api/health` - should return `{"status":"ok"}`
2. Login with test credentials
3. Navigate to `/settings` to configure currency
4. Navigate to `/products` to see products with correct currency formatting
