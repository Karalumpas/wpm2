import { db } from '../src/db';
import { settings, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function createDefaultSettings() {
  try {
    console.log('Creating default settings for all users...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users`);
    
    for (const user of allUsers) {
      // Check if user already has settings
      const [existingSettings] = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, user.id))
        .limit(1);
        
      if (!existingSettings) {
        // Create default settings
        await db.insert(settings).values({
          userId: user.id,
          currency: 'DKK',
          currencySymbol: 'kr',
          currencyPosition: 'right_space',
          productsPerPage: '24',
          defaultViewMode: 'grid',
        });
        console.log(`✅ Created default settings for user: ${user.email}`);
      } else {
        console.log(`⏭️ Settings already exist for user: ${user.email}`);
      }
    }
    
    console.log('✅ Default settings creation completed');
  } catch (error) {
    console.error('❌ Error creating default settings:', error);
    process.exit(1);
  }
}

createDefaultSettings();
