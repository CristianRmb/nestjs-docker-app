#!/usr/bin/env node

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test users data (matching JWT token payloads)
const testUsers = [
  {
    id: '91243910-534a-493b-8cd8-0ceee18cd98f',
    username: 'testuser2',
    email: 'testuser2@example.com',
    displayName: 'Test User 2',
    bio: 'Test user for WebSocket testing',
    status: 'OFFLINE',
  },
  {
    id: 'b4c2d5e8-f9a1-4b2c-8d3e-9f1a2b3c4d5e',
    username: 'member',
    email: 'member@example.com',
    displayName: 'Member User',
    bio: 'Member user for WebSocket testing',
    status: 'OFFLINE',
  },
];

async function createTestUsers() {
  console.log('🔄 Setting up test users for WebSocket testing...\n');

  try {
    // First check total user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);

    for (const userData of testUsers) {
      try {
        // Check if user already exists by ID
        const existingUserById = await prisma.user.findUnique({
          where: { id: userData.id },
        });

        if (existingUserById) {
          console.log(
            `✅ User ${userData.username} already exists (ID: ${userData.id})`,
          );
          continue;
        }

        // Check if user exists by email (potential conflict)
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUserByEmail) {
          console.log(
            `⚠️  User with email ${userData.email} exists but different ID`,
          );
          console.log(`   Existing ID: ${existingUserByEmail.id}`);
          console.log(`   Expected ID: ${userData.id}`);

          // Update the existing user's ID to match our JWT token
          const updatedUser = await prisma.user.update({
            where: { email: userData.email },
            data: {
              id: userData.id,
              username: userData.username,
              displayName: userData.displayName,
              bio: userData.bio,
            },
          });
          console.log(
            `✅ Updated existing user to match JWT token requirements`,
          );
          continue;
        }

        // Hash a default password
        const hashedPassword = await bcrypt.hash('testpassword123', 10);

        // Create the user
        const newUser = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Created user: ${newUser.username} (ID: ${newUser.id})`);
      } catch (error) {
        console.error(
          `❌ Error processing user ${userData.username}:`,
          error.message,
        );
      }
    }

    console.log('\n🎉 Test users setup completed!');
    console.log('\n📋 User credentials for testing:');
    testUsers.forEach((user) => {
      console.log(`   👤 ${user.username}: ${user.email} / testpassword123`);
    });
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

async function main() {
  try {
    await createTestUsers();
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
