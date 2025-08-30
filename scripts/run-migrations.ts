/**
 * Manual Migration Script
 *
 * Dette script kører migrationerne manuelt da drizzle-kit hænger
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString =
  'postgresql://postgres:postgresPW@192.168.0.180:5432/wpm2';

async function runMigrations() {
  console.log('🔄 Running database migrations manually...');

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Create migrations table if it doesn't exist
    console.log('\n1. Creating migrations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;
    console.log('✅ Migrations table ready');

    // Get migration files
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`\n2. Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Check which migrations have already been run
    const appliedMigrations = await sql`
      SELECT hash FROM __drizzle_migrations ORDER BY created_at
    `;
    const appliedHashes = new Set(appliedMigrations.map((m: any) => m.hash));

    console.log(`\n3. Running migrations...`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract the hash from the filename or content
      const hash = file.replace('.sql', '');

      if (appliedHashes.has(hash)) {
        console.log(`   ⏩ Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`   🔄 Applying ${file}...`);

      try {
        // Split the content by statements and execute each
        const statements = content
          .split(';')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          await sql.unsafe(statement);
        }

        // Record the migration
        await sql`
          INSERT INTO __drizzle_migrations (hash, created_at) 
          VALUES (${hash}, ${Date.now()})
        `;

        console.log(`   ✅ Applied ${file}`);
      } catch (error) {
        console.error(`   ❌ Failed to apply ${file}:`);
        console.error(`      ${error}`);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');

    // Verify tables were created
    console.log('\n4. Verifying created tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`   Created ${tables.length} tables:`);
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    await sql.end();
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
