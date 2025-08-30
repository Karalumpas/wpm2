import { db } from '../src/db';
import { users, settings } from '../src/db/schema';
import { hashPassword } from '../src/lib/auth';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create a test user
    const testEmail = 'admin@wpm2.com';
    const testPassword = 'admin123';

    console.log('🔐 Creating test user...');
    const hashedPassword = await hashPassword(testPassword);

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: hashedPassword,
      })
      .returning()
      .onConflictDoNothing();

    if (user) {
      console.log(`✅ Created test user: ${testEmail}`);

      // Create default settings for the user
      console.log('⚙️ Creating default settings...');
      await db
        .insert(settings)
        .values({
          userId: user.id,
          currency: 'DKK',
          currencySymbol: 'kr',
          currencyPosition: 'right_space',
          productsPerPage: '24',
          defaultViewMode: 'grid',
        })
        .onConflictDoNothing();

      console.log('✅ Created default settings');
    } else {
      console.log('ℹ️ Test user already exists');

      // Get existing user and create settings if needed
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      if (existingUser) {
        const [existingSettings] = await db
          .select()
          .from(settings)
          .where(eq(settings.userId, existingUser.id))
          .limit(1);

        if (!existingSettings) {
          await db.insert(settings).values({
            userId: existingUser.id,
            currency: 'DKK',
            currencySymbol: 'kr',
            currencyPosition: 'right_space',
            productsPerPage: '24',
            defaultViewMode: 'grid',
          });
          console.log('✅ Created default settings for existing user');
        } else {
          console.log('ℹ️ Settings already exist');
        }
      }
    }

    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('Test credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
