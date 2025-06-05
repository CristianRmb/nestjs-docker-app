#!/usr/bin/env node

const { PrismaClient } = require('../generated/prisma');

console.log('🚀 Starting conversation creation script...');

const prisma = new PrismaClient();

// Test users IDs (matching JWT tokens)
const USER1_ID = '91243910-534a-493b-8cd8-0ceee18cd98f'; // testuser2
const USER2_ID = 'b4c2d5e8-f9a1-4b2c-8d3e-9f1a2b3c4d5e'; // member
const TEST_CONVERSATION_ID = 'test-conversation-123';

async function createTestConversation() {
  console.log('🔄 Creating test direct conversation...\n');

  try {
    // Check if conversation already exists
    const existingConversation = await prisma.directConversation.findUnique({
      where: { id: TEST_CONVERSATION_ID },
      include: {
        members: {
          include: {
            user: {
              select: { username: true, id: true },
            },
          },
        },
      },
    });

    if (existingConversation) {
      console.log(`✅ Conversation already exists: ${TEST_CONVERSATION_ID}`);
      console.log(
        `   Members: ${existingConversation.members.map((m) => m.user.username).join(', ')}`,
      );
      return;
    }

    // Verify both users exist
    const user1 = await prisma.user.findUnique({ where: { id: USER1_ID } });
    const user2 = await prisma.user.findUnique({ where: { id: USER2_ID } });

    if (!user1 || !user2) {
      console.error('❌ Test users not found! Run create-test-users.js first');
      return;
    }

    console.log(`📋 Creating conversation between:`);
    console.log(`   👤 ${user1.username} (${USER1_ID})`);
    console.log(`   👥 ${user2.username} (${USER2_ID})`);

    // Create the direct conversation
    const conversation = await prisma.directConversation.create({
      data: {
        id: TEST_CONVERSATION_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: {
          create: [
            {
              userId: USER1_ID,
              joinedAt: new Date(),
            },
            {
              userId: USER2_ID,
              joinedAt: new Date(),
            },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    });

    console.log(`✅ Created conversation: ${conversation.id}`);
    console.log(
      `   Members: ${conversation.members.map((m) => m.user.username).join(', ')}`,
    );
    console.log(`   Created: ${conversation.createdAt.toLocaleString()}`);

    console.log('\n🎉 Test conversation setup completed!');
    console.log('\n📋 Test Configuration:');
    console.log(`   🆔 Conversation ID: ${TEST_CONVERSATION_ID}`);
    console.log(`   👤 User 1: ${user1.username} (${USER1_ID})`);
    console.log(`   👥 User 2: ${user2.username} (${USER2_ID})`);
  } catch (error) {
    console.error('❌ Error creating conversation:', error.message);
  }
}

async function main() {
  try {
    await createTestConversation();
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
