const WhatsAppClient = require('./whatsapp-client');

async function main() {
  const client = new WhatsAppClient();
  
  try {
    // Get your recent chats
    console.log('Fetching recent chats...');
    const chats = await client.listChats({ limit: 1 });
    console.log('First chat:', chats[0].name, '(ID:', chats[0].id, ')');
    
    // Send a message to the first chat
    const chatId = chats[0].id;
    console.log('Sending a test message to:', chatId);
    const result = await client.sendMessage(chatId, 'This is a test message from WhatsApp MCP!');
    console.log('Message sent! Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 