#!/usr/bin/env node

const io = require('socket.io-client');
const readline = require('readline');

// Configuration
const SERVER_URL = 'http://localhost:3000';
let JWT_TOKEN = '';
let socket = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function log(message, type = 'info') {
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
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function connect() {
  if (!JWT_TOKEN) {
    console.log('❌ Please set JWT_TOKEN first!');
    return;
  }

  log(`Connecting to ${SERVER_URL}...`);

  socket = io(SERVER_URL, {
    auth: {
      token: JWT_TOKEN,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    log('Connected to WebSocket!', 'success');
    console.log('\n📋 Available commands:');
    console.log('  send-dm <conversationId> <message>   - Send direct message');
    console.log(
      '  send-channel <channelId> <message>   - Send channel message',
    );
    console.log('  typing-dm <conversationId>           - Start typing in DM');
    console.log(
      '  typing-channel <channelId>           - Start typing in channel',
    );
    console.log('  stop-typing-dm <conversationId>      - Stop typing in DM');
    console.log(
      '  stop-typing-channel <channelId>      - Stop typing in channel',
    );
    console.log('  disconnect                           - Disconnect');
    console.log('  help                                - Show this help');
    console.log('');
  });

  socket.on('connected', (data) => {
    log(`Connection confirmed: ${JSON.stringify(data)}`, 'success');
  });

  socket.on('disconnect', (reason) => {
    log(`Disconnected: ${reason}`, 'error');
  });

  socket.on('error', (error) => {
    log(`Error: ${JSON.stringify(error)}`, 'error');
  });

  socket.on('connect_error', (error) => {
    log(`Connection error: ${error.message}`, 'error');
  });

  // Message events
  socket.on('new_message', (data) => {
    const messageType = data.channelId ? '📢 CHANNEL' : '💬 DM';
    const location = data.channelId || data.directConversationId;

    console.log(`\n${messageType} MESSAGE RECEIVED:`);
    console.log(`   👤 From: ${data.sender?.username || data.senderId}`);
    console.log(`   📝 Content: ${data.content}`);
    console.log(`   🕒 Time: ${new Date(data.createdAt).toLocaleTimeString()}`);
    console.log(`   📋 Location: ${location}`);
    console.log('');
    process.stdout.write('> ');
  });

  socket.on('message_updated', (data) => {
    log(`📝 Message updated: ${JSON.stringify(data)}`, 'receive');
  });

  socket.on('message_deleted', (data) => {
    log(`🗑️ Message deleted: ${JSON.stringify(data)}`, 'receive');
  });

  // Typing events
  socket.on('user_typing', (data) => {
    if (data.typing) {
      console.log(`\n⌨️ Someone is typing... (User: ${data.userId})`);
    } else {
      console.log(`\n⏹️ Someone stopped typing (User: ${data.userId})`);
    }
    process.stdout.write('> ');
  });

  socket.on('user_stopped_typing', (data) => {
    console.log(`\n⏹️ Someone stopped typing (User: ${data.userId})`);
    process.stdout.write('> ');
  });

  // Status events
  socket.on('friend_status_change', (data) => {
    log(
      `👥 Friend status change: ${data.userId} is now ${data.status}`,
      'receive',
    );
  });
}

function handleCommand(input) {
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();

  switch (command) {
    case 'token':
      JWT_TOKEN = parts[1];
      log(`JWT token set: ${JWT_TOKEN.substring(0, 20)}...`, 'success');
      break;

    case 'connect':
      connect();
      break;

    case 'disconnect':
      if (socket) {
        socket.disconnect();
        socket = null;
        log('Disconnected');
      }
      break;

    case 'send-dm':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const conversationId = parts[1];
      const dmMessage = parts.slice(2).join(' ');
      if (!conversationId || !dmMessage) {
        log('Usage: send-dm <conversationId> <message>', 'error');
        break;
      }
      const dmData = {
        directConversationId: conversationId,
        content: dmMessage,
      };
      log(
        `📤 Sending DM: "${dmMessage}" to conversation ${conversationId}`,
        'send',
      );
      socket.emit('send_message', dmData);
      break;

    case 'send-channel':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const channelId = parts[1];
      const channelMessage = parts.slice(2).join(' ');
      if (!channelId || !channelMessage) {
        log('Usage: send-channel <channelId> <message>', 'error');
        break;
      }
      const channelData = {
        channelId: channelId,
        content: channelMessage,
      };
      log(
        `📤 Sending channel message: "${channelMessage}" to channel ${channelId}`,
        'send',
      );
      socket.emit('send_message', channelData);
      break;

    case 'typing-dm':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const typingConvId = parts[1];
      if (!typingConvId) {
        log('Usage: typing-dm <conversationId>', 'error');
        break;
      }
      socket.emit('typing_start', { directConversationId: typingConvId });
      log(`⌨️ Started typing in DM ${typingConvId}`, 'send');
      break;

    case 'typing-channel':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const typingChannelId = parts[1];
      if (!typingChannelId) {
        log('Usage: typing-channel <channelId>', 'error');
        break;
      }
      socket.emit('typing_start', { channelId: typingChannelId });
      log(`⌨️ Started typing in channel ${typingChannelId}`, 'send');
      break;

    case 'stop-typing-dm':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const stopTypingConvId = parts[1];
      if (!stopTypingConvId) {
        log('Usage: stop-typing-dm <conversationId>', 'error');
        break;
      }
      socket.emit('typing_stop', { directConversationId: stopTypingConvId });
      log(`⏹️ Stopped typing in DM ${stopTypingConvId}`, 'send');
      break;

    case 'stop-typing-channel':
      if (!socket || !socket.connected) {
        log('Not connected!', 'error');
        break;
      }
      const stopTypingChannelId = parts[1];
      if (!stopTypingChannelId) {
        log('Usage: stop-typing-channel <channelId>', 'error');
        break;
      }
      socket.emit('typing_stop', { channelId: stopTypingChannelId });
      log(`⏹️ Stopped typing in channel ${stopTypingChannelId}`, 'send');
      break;

    case 'help':
      console.log('\n📋 Available commands:');
      console.log('  token <jwt>                          - Set JWT token');
      console.log(
        '  connect                              - Connect to WebSocket',
      );
      console.log(
        '  send-dm <conversationId> <message>   - Send direct message',
      );
      console.log(
        '  send-channel <channelId> <message>   - Send channel message',
      );
      console.log(
        '  typing-dm <conversationId>           - Start typing in DM',
      );
      console.log(
        '  typing-channel <channelId>           - Start typing in channel',
      );
      console.log('  stop-typing-dm <conversationId>      - Stop typing in DM');
      console.log(
        '  stop-typing-channel <channelId>      - Stop typing in channel',
      );
      console.log('  disconnect                           - Disconnect');
      console.log('  exit                                - Exit program');
      console.log('');
      break;

    case 'exit':
      if (socket) {
        socket.disconnect();
      }
      rl.close();
      process.exit(0);
      break;

    default:
      log(
        `Unknown command: ${command}. Type 'help' for available commands.`,
        'error',
      );
  }
}

// Start the CLI
console.log('🚀 Socket.IO WebSocket Test Client');
console.log('=====================================');
console.log('1. First, set your JWT token: token <your-jwt-token>');
console.log('2. Then connect: connect');
console.log('3. Type "help" for available commands');
console.log('');

rl.on('line', handleCommand);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  if (socket) {
    socket.disconnect();
  }
  rl.close();
  process.exit(0);
});
