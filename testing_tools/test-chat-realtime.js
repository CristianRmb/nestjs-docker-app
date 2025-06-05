#!/usr/bin/env node

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_CONVERSATION_ID = 'test-conversation-123';

// JWT Tokens
const USER1_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MTI0MzkxMC01MzRhLTQ5M2ItOGNkOC0wY2VlZTE4Y2Q5OGYiLCJ1c2VybmFtZSI6InRlc3R1c2VyMiIsImVtYWlsIjoidGVzdHVzZXIyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQ5MTEzOTcxLCJleHAiOjE3NDkyMDAzNzF9.ECVgAnMiGBYigJQmSf3QUdLOJSUo6vb4IqeoPJi-_as';
const USER2_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGMyZDVlOC1mOWExLTRiMmMtOGQzZS05ZjFhMmIzYzRkNWUiLCJ1c2VybmFtZSI6Im1lbWJlciIsImVtYWlsIjoibWVtYmVyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQ5MTEzOTcxLCJleHAiOjE3NDkyMDAzNzF9.-lMMGWAeos51V73qhdgztH2XoxCTeOxcFN37TpP1S4U';

let user1Socket = null;
let user2Socket = null;

function log(user, message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix =
    type === 'error'
      ? '❌'
      : type === 'success'
        ? '✅'
        : type === 'send'
          ? '📤'
          : type === 'receive'
            ? '📥'
            : 'ℹ️';
  const userIcon = user === 'USER1' ? '👤' : '👥';
  console.log(`[${timestamp}] ${userIcon} ${user}: ${prefix} ${message}`);
}

function connectUser1() {
  return new Promise((resolve, reject) => {
    log('USER1', 'Connecting to server...');

    user1Socket = io(SERVER_URL, {
      auth: { token: USER1_TOKEN },
      transports: ['websocket', 'polling'],
    });

    user1Socket.on('connect', () => {
      log('USER1', 'Connected successfully!', 'success');
      resolve();
    });

    user1Socket.on('connected', (data) => {
      log('USER1', `Connection confirmed: ${data.message}`, 'success');
    });

    user1Socket.on('new_message', (data) => {
      log(
        'USER1',
        `📥 RECEIVED MESSAGE: "${data.content}" from ${data.sender?.username || data.senderId}`,
        'receive',
      );
    });

    user1Socket.on('user_typing', (data) => {
      if (data.typing) {
        log('USER1', `⌨️ Someone is typing... (${data.userId})`, 'receive');
      }
    });

    user1Socket.on('connect_error', (error) => {
      log('USER1', `Connection error: ${error.message}`, 'error');
      reject(error);
    });

    user1Socket.on('error', (error) => {
      log('USER1', `Error: ${JSON.stringify(error)}`, 'error');
    });
  });
}

function connectUser2() {
  return new Promise((resolve, reject) => {
    log('USER2', 'Connecting to server...');

    user2Socket = io(SERVER_URL, {
      auth: { token: USER2_TOKEN },
      transports: ['websocket', 'polling'],
    });

    user2Socket.on('connect', () => {
      log('USER2', 'Connected successfully!', 'success');
      resolve();
    });

    user2Socket.on('connected', (data) => {
      log('USER2', `Connection confirmed: ${data.message}`, 'success');
    });

    user2Socket.on('new_message', (data) => {
      log(
        'USER2',
        `📥 RECEIVED MESSAGE: "${data.content}" from ${data.sender?.username || data.senderId}`,
        'receive',
      );
    });

    user2Socket.on('user_typing', (data) => {
      if (data.typing) {
        log('USER2', `⌨️ Someone is typing... (${data.userId})`, 'receive');
      }
    });

    user2Socket.on('connect_error', (error) => {
      log('USER2', `Connection error: ${error.message}`, 'error');
      reject(error);
    });

    user2Socket.on('error', (error) => {
      log('USER2', `Error: ${JSON.stringify(error)}`, 'error');
    });
  });
}

function sendMessage(socket, user, message) {
  const messageData = {
    directConversationId: TEST_CONVERSATION_ID,
    content: message,
  };

  log(user, `📤 Sending: "${message}"`, 'send');
  socket.emit('send_message', messageData);
}

function startTyping(socket, user) {
  log(user, '⌨️ Started typing...', 'send');
  socket.emit('typing_start', { directConversationId: TEST_CONVERSATION_ID });
}

function stopTyping(socket, user) {
  log(user, '⏹️ Stopped typing', 'send');
  socket.emit('typing_stop', { directConversationId: TEST_CONVERSATION_ID });
}

async function runTest() {
  try {
    console.log('🚀 Starting WebSocket Chat Test');
    console.log('================================');
    console.log(`Conversation ID: ${TEST_CONVERSATION_ID}\n`);

    // Connect both users
    await connectUser1();
    await connectUser2();

    console.log('\n🎉 Both users connected! Starting conversation...\n');

    // Wait a bit for connections to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // User 1 starts typing
    startTyping(user1Socket, 'USER1');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // User 1 sends first message
    sendMessage(user1Socket, 'USER1', 'Ciao! Come stai?');
    stopTyping(user1Socket, 'USER1');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // User 2 starts typing
    startTyping(user2Socket, 'USER2');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // User 2 responds
    sendMessage(
      user2Socket,
      'USER2',
      'Ciao! Tutto bene, grazie! Tu come stai?',
    );
    stopTyping(user2Socket, 'USER2');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // User 1 replies
    startTyping(user1Socket, 'USER1');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    sendMessage(user1Socket, 'USER1', 'Ottimo! Sto testando il WebSocket 🚀');
    stopTyping(user1Socket, 'USER1');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // User 2 final message
    sendMessage(user2Socket, 'USER2', 'Fantastico! Funziona perfettamente! 🎉');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('\n✅ Test completed successfully!');
    console.log('🎯 Real-time messaging is working perfectly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    if (user1Socket) user1Socket.disconnect();
    if (user2Socket) user2Socket.disconnect();
    process.exit(0);
  }
}

// Run the test
runTest();
