const WhatsAppClient = require('./whatsapp-client');

async function main() {
  const client = new WhatsAppClient();
  
  try {
    // Get your recent chats
    console.log('Fetching recent chats...');
    const chats = await client.listChats({ limit: 1 });
    
    if (chats.length === 0) {
      console.log('No chats found.');
      return;
    }
    
    const chat = chats[0];
    console.log(`Fetching messages from chat: ${chat.name} (${chat.id})`);
    
    // Get messages from the first chat
    const messages = await client.listMessages({ 
      chat_jid: chat.id,
      limit: 5
    });
    
    if (messages.length === 0) {
      console.log('No messages found in this chat.');
    } else {
      console.log(`Found ${messages.length} messages:`);
      messages.forEach((msg, index) => {
        const date = new Date(msg.timestamp * 1000).toLocaleString();
        console.log(`${index + 1}. [${date}] From: ${msg.from.split('@')[0]}`);
        console.log(`   Message: ${msg.body}`);
        if (msg.hasMedia) {
          console.log('   [Contains media]');
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 