#!/usr/bin/env node

const readline = require('readline');
const WhatsAppClient = require('./whatsapp-client');

const client = new WhatsAppClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display menu
function showMenu() {
  console.log('\n=== WhatsApp MCP CLI ===');
  console.log('1. Search contacts');
  console.log('2. List chats');
  console.log('3. List messages from a chat');
  console.log('4. Send a message');
  console.log('5. Send a file');
  console.log('6. Download media from a message');
  console.log('7. Get message context');
  console.log('8. Exit');
  rl.question('\nEnter your choice (1-8): ', handleMenu);
}

// Handle menu choice
async function handleMenu(choice) {
  try {
    switch (choice) {
      case '1':
        await searchContacts();
        break;
      case '2':
        await listChats();
        break;
      case '3':
        await listMessages();
        break;
      case '4':
        await sendMessage();
        break;
      case '5':
        await sendFile();
        break;
      case '6':
        await downloadMedia();
        break;
      case '7':
        await getMessageContext();
        break;
      case '8':
        console.log('Exiting...');
        rl.close();
        return;
      default:
        console.log('Invalid choice. Please try again.');
        showMenu();
        return;
    }
  } catch (error) {
    console.error('Error:', error.message);
    showMenu();
  }
}

// Search contacts
async function searchContacts() {
  rl.question('Enter search query: ', async (query) => {
    try {
      const contacts = await client.searchContacts(query);
      console.log('\nSearch results:');
      
      if (contacts.length === 0) {
        console.log('No contacts found.');
      } else {
        contacts.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.name} (${contact.number || 'No number'}) - ID: ${contact.id}`);
        });
      }
      
      showMenu();
    } catch (error) {
      console.error('Error searching contacts:', error.message);
      showMenu();
    }
  });
}

// List chats
async function listChats() {
  try {
    const chats = await client.listChats({ limit: 10 });
    console.log('\nRecent chats:');
    
    if (chats.length === 0) {
      console.log('No chats found.');
    } else {
      chats.forEach((chat, index) => {
        const lastMsg = chat.lastMessage ? ` - Last message: ${chat.lastMessage.body.substring(0, 30)}...` : '';
        console.log(`${index + 1}. ${chat.name} (${chat.isGroup ? 'Group' : 'Direct'}) - ID: ${chat.id}${lastMsg}`);
      });
    }
    
    showMenu();
  } catch (error) {
    console.error('Error listing chats:', error.message);
    showMenu();
  }
}

// List messages from a chat
async function listMessages() {
  rl.question('Enter chat JID: ', async (chatJid) => {
    try {
      const messages = await client.listMessages({ 
        chat_jid: chatJid,
        limit: 10
      });
      
      console.log('\nRecent messages:');
      
      if (messages.length === 0) {
        console.log('No messages found.');
      } else {
        messages.forEach((msg, index) => {
          const date = new Date(msg.timestamp * 1000).toLocaleString();
          console.log(`${index + 1}. [${date}] From: ${msg.from.split('@')[0]} - ID: ${msg.id}`);
          console.log(`   ${msg.body}`);
          if (msg.hasMedia) {
            console.log('   [Contains media]');
          }
          console.log('');
        });
      }
      
      showMenu();
    } catch (error) {
      console.error('Error listing messages:', error.message);
      showMenu();
    }
  });
}

// Send a message
async function sendMessage() {
  rl.question('Enter recipient (phone number or JID): ', (recipient) => {
    rl.question('Enter message: ', async (message) => {
      try {
        const result = await client.sendMessage(recipient, message);
        console.log('\nMessage result:', result);
        showMenu();
      } catch (error) {
        console.error('Error sending message:', error.message);
        showMenu();
      }
    });
  });
}

// Send a file
async function sendFile() {
  rl.question('Enter recipient (phone number or JID): ', (recipient) => {
    rl.question('Enter file path: ', async (filePath) => {
      try {
        const result = await client.sendFile(recipient, filePath);
        console.log('\nFile send result:', result);
        showMenu();
      } catch (error) {
        console.error('Error sending file:', error.message);
        showMenu();
      }
    });
  });
}

// Download media
async function downloadMedia() {
  rl.question('Enter message ID: ', (messageId) => {
    rl.question('Enter chat JID: ', async (chatJid) => {
      try {
        const result = await client.downloadMedia(messageId, chatJid);
        console.log('\nMedia download result:', result);
        showMenu();
      } catch (error) {
        console.error('Error downloading media:', error.message);
        showMenu();
      }
    });
  });
}

// Get message context
async function getMessageContext() {
  rl.question('Enter message ID: ', (messageId) => {
    try {
      rl.question('Number of messages before (default: 5): ', (before) => {
        rl.question('Number of messages after (default: 5): ', async (after) => {
          const result = await client.getMessageContext(
            messageId, 
            before ? parseInt(before) : 5, 
            after ? parseInt(after) : 5
          );
          
          console.log('\nMessage context:');
          
          if (!result) {
            console.log('Message not found.');
          } else {
            console.log(`Chat: ${result.chat.name} (${result.chat.id})`);
            console.log('\nContext messages:');
            
            result.contextMessages.forEach((msg) => {
              const date = new Date(msg.timestamp * 1000).toLocaleString();
              const marker = msg.isTargetMessage ? '→ ' : '  ';
              console.log(`${marker}[${date}] From: ${msg.from.split('@')[0]}`);
              console.log(`${marker} ${msg.body}`);
              console.log('');
            });
          }
          
          showMenu();
        });
      });
    } catch (error) {
      console.error('Error getting message context:', error.message);
      showMenu();
    }
  });
}

// Start the CLI
console.log('Starting WhatsApp MCP CLI...');
console.log('Make sure the WhatsApp MCP server is running!');
showMenu(); 