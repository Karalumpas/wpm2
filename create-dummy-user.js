const { db } = require('./src/db/index.ts');
const { users } = require('./src/db/schema.ts');

async function createDummyUser() {
  try {
    const [user] = await db.insert(users).values({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'dummy@example.com',
      passwordHash: 'dummy-hash'
    }).returning();
    console.log('Dummy user created:', user);
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('Dummy user already exists');
    } else {
      console.log('Error creating dummy user:', error.message);
    }
  }
  process.exit(0);
}

createDummyUser();
