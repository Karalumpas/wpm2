#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Dette script tester forbindelsen til PostgreSQL databasen
 * og verificerer at alle nødvendige tabeller eksisterer.
 */

import { config } from 'dotenv';
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔄 Testing database connection...');
  console.log(`📍 Connecting to: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    // Test basic connection
    console.log('\n1. Testing basic database connection...');
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as version`);
    console.log('✅ Database connection successful!');
    console.log(`   Current time: ${result[0].current_time}`);
    console.log(`   PostgreSQL version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);

    // Test database exists
    console.log('\n2. Checking database exists...');
    const dbCheck = await db.execute(sql`SELECT current_database() as db_name`);
    console.log(`✅ Connected to database: ${dbCheck[0].db_name}`);

    // List existing tables
    console.log('\n3. Checking existing tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📋 Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    // Check if migration table exists
    const migrationTableExists = tables.some(table => table.table_name === '__drizzle_migrations');
    if (migrationTableExists) {
      console.log('\n4. Checking migration status...');
      const migrations = await db.execute(sql`
        SELECT id, hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at
      `);
      console.log(`📦 Applied migrations: ${migrations.length}`);
      migrations.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.hash.substring(0, 8)}... (${migration.created_at})`);
      });
    } else {
      console.log('\n4. Migration table not found - database needs to be migrated');
    }

    // Check for our core tables
    console.log('\n5. Checking core application tables...');
    const requiredTables = ['users', 'shops'];
    const productTables = ['products', 'product_variants', 'brands', 'categories'];
    
    console.log('   Core tables:');
    requiredTables.forEach(tableName => {
      const exists = tables.some(table => table.table_name === tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    });

    console.log('   Product tables:');
    productTables.forEach(tableName => {
      const exists = tables.some(table => table.table_name === tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    });

    // Test table counts if tables exist
    const existingTables = tables.map(t => t.table_name);
    if (existingTables.includes('users')) {
      console.log('\n6. Checking table contents...');
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log(`   Users: ${userCount[0].count} records`);
    }

    if (existingTables.includes('shops')) {
      const shopCount = await db.execute(sql`SELECT COUNT(*) as count FROM shops`);
      console.log(`   Shops: ${shopCount[0].count} records`);
    }

    if (existingTables.includes('products')) {
      const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
      console.log(`   Products: ${productCount[0].count} records`);
    }

    console.log('\n🎉 Database connection test completed successfully!');
    
    if (!migrationTableExists) {
      console.log('\n⚠️  Next steps:');
      console.log('   1. Run migrations: npm run db:migrate');
      console.log('   2. Seed data: npm run seed');
    }

  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error details:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check if the database server is running');
      console.error('   - Verify the hostname/IP address is correct');
      console.error('   - Check network connectivity');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check if PostgreSQL is running on port 5432');
      console.error('   - Verify firewall settings');
      console.error('   - Check if the database is accepting connections');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check username and password');
      console.error('   - Verify user has access to the database');
      console.error('   - Check PostgreSQL authentication settings');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - Create the database: CREATE DATABASE wpm2;');
      console.error('   - Check database name in connection string');
    }
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
