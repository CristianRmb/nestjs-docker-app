#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestWorkspaceAndChannels() {
  try {
    console.log('🚀 Creating test workspace and channels...');

    // Create test workspace
    const workspace = await prisma.workspace.upsert({
      where: { id: 'test-workspace-123' },
      update: {},
      create: {
        id: 'test-workspace-123',
        name: 'Test Workspace',
        description: 'Workspace for WebSocket testing',
        ownerId: '91243910-534a-493b-8cd8-0ceee18cd98f', // testuser2 ID
        inviteCode: 'TEST123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Test workspace created:', workspace.name);

    // Create test channel
    const channel = await prisma.channel.upsert({
      where: { id: 'test-channel-456' },
      update: {},
      create: {
        id: 'test-channel-456',
        name: 'general',
        description: 'General test channel',
        workspaceId: 'test-workspace-123',
        type: 'TEXT', // Assuming TEXT type exists
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Test channel created:', channel.name);

    // Add both test users to the workspace
    const user1Id = '91243910-534a-493b-8cd8-0ceee18cd98f'; // testuser2
    const user2Id = 'b4c2d5e8-f9a1-4b2c-8d3e-9f1a2b3c4d5e'; // member

    // Check if workspace members table exists and add users
    try {
      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user1Id,
            workspaceId: 'test-workspace-123',
          },
        },
        update: {},
        create: {
          userId: user1Id,
          workspaceId: 'test-workspace-123',
          role: 'OWNER',
          joinedAt: new Date(),
        },
      });

      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user2Id,
            workspaceId: 'test-workspace-123',
          },
        },
        update: {},
        create: {
          userId: user2Id,
          workspaceId: 'test-workspace-123',
          role: 'MEMBER',
          joinedAt: new Date(),
        },
      });

      console.log('✅ Both users added to workspace');
    } catch (error) {
      console.log(
        '⚠️ Could not add workspace members (table might not exist):',
        error.message,
      );
    }

    // Add users to channel if channel members table exists
    try {
      await prisma.channelMember.upsert({
        where: {
          userId_channelId: {
            userId: user1Id,
            channelId: 'test-channel-456',
          },
        },
        update: {},
        create: {
          userId: user1Id,
          channelId: 'test-channel-456',
          role: 'ADMIN',
          joinedAt: new Date(),
        },
      });

      await prisma.channelMember.upsert({
        where: {
          userId_channelId: {
            userId: user2Id,
            channelId: 'test-channel-456',
          },
        },
        update: {},
        create: {
          userId: user2Id,
          channelId: 'test-channel-456',
          role: 'MEMBER',
          joinedAt: new Date(),
        },
      });

      console.log('✅ Both users added to channel');
    } catch (error) {
      console.log(
        '⚠️ Could not add channel members (table might not exist):',
        error.message,
      );
    }

    console.log('\n🎉 Test workspace and channel setup completed!');
    console.log('📋 Test Data:');
    console.log(`   Workspace ID: ${workspace.id}`);
    console.log(`   Channel ID: ${channel.id}`);
    console.log(`   User 1 (testuser2): ${user1Id}`);
    console.log(`   User 2 (member): ${user2Id}`);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createTestWorkspaceAndChannels();
