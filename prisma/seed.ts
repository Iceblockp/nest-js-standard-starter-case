import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Prisma with PG adapter (same as PrismaService)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Starting database seed...');

  // Hash password for all sample users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create sample users
  const users = [
    {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
    {
      email: 'john.doe@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    },
    {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
    },
    {
      email: 'inactive@example.com',
      password: hashedPassword,
      firstName: 'Inactive',
      lastName: 'User',
      isActive: false,
    },
  ];

  // Insert users one by one to handle duplicates gracefully
  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      });
      console.log(`✓ Created/found user: ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to create user ${userData.email}:`, error);
    }
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
