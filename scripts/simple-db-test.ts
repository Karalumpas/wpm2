/**
 * Simple PostgreSQL Connection Test
 */

import postgres from 'postgres';

const connectionString = 'postgresql://postgres:postgresPW@192.168.0.180:5432/wpm2';

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log(`Connection: ${connectionString.replace(/:postgresPW@/, ':***@')}`);
  
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('\n1. Testing basic connection...');
    const result = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Connection successful!');
    console.log(`Current time: ${result[0].current_time}`);
    console.log(`Version: ${result[0].version}`);
    
    console.log('\n2. Testing database access...');
    const dbResult = await sql`SELECT current_database() as db_name`;
    console.log(`Database: ${dbResult[0].db_name}`);
    
    console.log('\n3. Listing tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    await sql.end();
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

testConnection();
