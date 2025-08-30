import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('⚡ Starting database optimization operation...');
    
    // Get table sizes before optimization
    const tablesBefore = await db.execute(sql`
      SELECT 
        tablename, 
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    console.log('🔸 Database sizes before optimization:');
    tablesBefore.forEach((row: any) => {
      console.log(`   ${row.tablename}: ${row.size}`);
    });
    
    // Run VACUUM ANALYZE on all our tables
    const tables = ['products', 'product_variants', 'categories', 'brands', 'shops', 'product_categories', 'product_brands'];
    
    for (const table of tables) {
      console.log(`🔸 Optimizing table: ${table}`);
      await db.execute(sql.raw(`VACUUM ANALYZE ${table}`));
    }
    
    // Recompute statistics
    console.log('🔸 Recomputing database statistics...');
    await db.execute(sql`ANALYZE`);
    
    // Get table sizes after optimization
    const tablesAfter = await db.execute(sql`
      SELECT 
        tablename, 
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    console.log('🔸 Database sizes after optimization:');
    tablesAfter.forEach((row: any) => {
      console.log(`   ${row.tablename}: ${row.size}`);
    });
    
    // Get general database stats
    const stats = await db.execute(sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        (SELECT count(*) FROM pg_stat_user_tables) as table_count
    `);
    
    console.log('✅ Database optimization completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database optimization completed successfully',
      affectedRows: tables.length,
      details: {
        optimizedTables: tables.length,
        totalDatabaseSize: stats[0]?.total_size || 'Unknown',
        tableCount: stats[0]?.table_count || 0
      }
    });
  } catch (error) {
    console.error('❌ Database optimization error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to optimize database',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
