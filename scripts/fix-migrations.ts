/**
 * Fix Migration Tracking
 *
 * Dette script opdaterer migrations tabellen til at reflektere korrekt status
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString =
  'postgresql://postgres:postgresPW@192.168.0.180:5432/wpm2';

async function fixMigrationTracking() {
  console.log('🔄 Fixing migration tracking...');

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Clear existing migration records
    console.log('\n1. Clearing existing migration records...');
    await sql`DELETE FROM __drizzle_migrations`;

    // Get migration files
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log('\n2. Marking migrations as applied...');

    for (let i = 0; i < migrationFiles.length; i++) {
      const file = migrationFiles[i];
      const hash = file.replace('.sql', '');

      await sql`
        INSERT INTO __drizzle_migrations (hash, created_at) 
        VALUES (${hash}, ${Date.now() + i})
      `;

      console.log(`   ✅ Marked ${file} as applied`);
    }

    console.log('\n3. Verifying migration status...');
    const migrations = await sql`
      SELECT hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at
    `;

    console.log(`   Total migrations: ${migrations.length}`);
    migrations.forEach((migration: any, index: number) => {
      console.log(`   ${index + 1}. ${migration.hash}`);
    });

    await sql.end();
    console.log('\n🎉 Migration tracking fixed successfully!');
  } catch (error) {
    console.error('\n❌ Failed to fix migration tracking!');
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixMigrationTracking();
