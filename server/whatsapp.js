const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Handle QR code generation
client.on('qr', (qr) => {
  console.log('QR Code received. Scan this with your WhatsApp mobile app:');
  qrcode.generate(qr, { small: true });
});

// Handle client ready event
client.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

// Initialize client
client.initialize();

// Helper function to standardize JID format
const formatJid = (phoneNumber) => {
  if (phoneNumber.includes('@')) {
    return phoneNumber; // Already a JID
  }
  
  // Strip any non-numeric characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return `${cleanNumber}@s.whatsapp.net`;
};

// Search contacts by name or phone number
async function searchContacts(query) {
  try {
    const contacts = await client.getContacts();
    return contacts.filter(contact => {
      const name = contact.name || '';
      const number = contact.number || '';
      return name.toLowerCase().includes(query.toLowerCase()) || 
             number.includes(query);
    }).map(contact => ({
      id: contact.id._serialized,
      name: contact.name || 'Unknown',
      number: contact.number,
      isGroup: contact.isGroup
    }));
  } catch (error) {
    console.error('Error searching contacts:', error);
    return [];
  }
}

// List messages with optional filtering
async function listMessages(options = {}) {
  const {
    after,
    before,
    sender_phone_number,
    chat_jid,
    query,
    limit = 20,
    page = 0,
    include_context = true,
    context_before = 1,
    context_after = 1
  } = options;

  try {
    let targetChat;
    
    if (chat_jid) {
      targetChat = await client.getChatById(chat_jid);
    } else if (sender_phone_number) {
      const formattedJid = formatJid(sender_phone_number);
      targetChat = await client.getChatById(formattedJid);
    } else {
      // If no chat specified, get all chats and collect messages
      const chats = await client.getChats();
      let allMessages = [];
      
      for (const chat of chats.slice(0, 5)) { // Limit to 5 chats to avoid performance issues
        const messages = await chat.fetchMessages({ limit: 10 });
        allMessages = [...allMessages, ...messages.map(msg => ({
          id: msg.id._serialized,
          body: msg.body,
          timestamp: msg.timestamp,
          from: msg.from,
          to: msg.to,
          author: msg.author,
          chat: {
            id: chat.id._serialized,
            name: chat.name
          }
        }))];
      }
      
      // Apply filters
      return allMessages
        .filter(msg => {
          if (query && !msg.body.toLowerCase().includes(query.toLowerCase())) return false;
          if (after && msg.timestamp < new Date(after).getTime()/1000) return false;
          if (before && msg.timestamp > new Date(before).getTime()/1000) return false;
          return true;
        })
        .slice(page * limit, (page + 1) * limit);
    }
    
    // Get messages from specific chat
    const messages = await targetChat.fetchMessages({ limit: 100 });
    
    // Apply filters
    let filteredMessages = messages.filter(msg => {
      if (query && !msg.body.toLowerCase().includes(query.toLowerCase())) return false;
      if (after && msg.timestamp < new Date(after).getTime()/1000) return false;
      if (before && msg.timestamp > new Date(before).getTime()/1000) return false;
      if (sender_phone_number && !msg.from.includes(sender_phone_number.replace(/\D/g, ''))) return false;
      return true;
    });
    
    // Apply pagination
    filteredMessages = filteredMessages.slice(page * limit, (page + 1) * limit);
    
    // Format messages
    return filteredMessages.map(msg => ({
      id: msg.id._serialized,
      body: msg.body,
      timestamp: msg.timestamp,
      from: msg.from,
      to: msg.to,
      hasMedia: msg.hasMedia,
      chat: {
        id: targetChat.id._serialized,
        name: targetChat.name
      }
    }));
  } catch (error) {
    console.error('Error listing messages:', error);
    return [];
  }
}

// List chats
async function listChats(options = {}) {
  const {
    query,
    limit = 20,
    page = 0,
    include_last_message = true,
    sort_by = "last_active"
  } = options;
  
  try {
    let chats = await client.getChats();
    
    // Apply filters
    if (query) {
      chats = chats.filter(chat => {
        const name = chat.name || '';
        const id = chat.id._serialized || '';
        return name.toLowerCase().includes(query.toLowerCase()) || 
               id.includes(query);
      });
    }
    
    // Apply sorting
    if (sort_by === "last_active") {
      chats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (sort_by === "name") {
      chats.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    
    // Apply pagination
    chats = chats.slice(page * limit, (page + 1) * limit);
    
    // Format chats
    return await Promise.all(chats.map(async (chat) => {
      const result = {
        id: chat.id._serialized,
        name: chat.name || 'Unknown',
        isGroup: chat.isGroup,
        timestamp: chat.timestamp
      };
      
      if (include_last_message) {
        const messages = await chat.fetchMessages({ limit: 1 });
        if (messages.length > 0) {
          result.lastMessage = {
            id: messages[0].id._serialized,
            body: messages[0].body,
            timestamp: messages[0].timestamp,
            from: messages[0].from
          };
        }
      }
      
      return result;
    }));
  } catch (error) {
    console.error('Error listing chats:', error);
    return [];
  }
}

// Get chat by JID
async function getChat(chat_jid, include_last_message = true) {
  try {
    const chat = await client.getChatById(chat_jid);
    const result = {
      id: chat.id._serialized,
      name: chat.name || 'Unknown',
      isGroup: chat.isGroup,
      timestamp: chat.timestamp
    };
    
    if (include_last_message) {
      const messages = await chat.fetchMessages({ limit: 1 });
      if (messages.length > 0) {
        result.lastMessage = {
          id: messages[0].id._serialized,
          body: messages[0].body,
          timestamp: messages[0].timestamp,
          from: messages[0].from
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting chat:', error);
    return null;
  }
}

// Get direct chat by contact phone number
async function getDirectChatByContact(phone_number) {
  try {
    const jid = formatJid(phone_number);
    return await getChat(jid);
  } catch (error) {
    console.error('Error getting direct chat by contact:', error);
    return null;
  }
}

// Get all chats involving a contact
async function getContactChats(jid, limit = 20, page = 0) {
  try {
    const allChats = await client.getChats();
    const contactChats = allChats.filter(chat => {
      if (chat.isGroup) {
        // For groups, check if contact is a participant
        return chat.participants && chat.participants.some(p => p.id._serialized === jid);
      } else {
        // For direct chats, check if the chat ID matches the contact
        return chat.id._serialized === jid;
      }
    });
    
    // Apply pagination
    const paginatedChats = contactChats.slice(page * limit, (page + 1) * limit);
    
    // Format chats
    return paginatedChats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name || 'Unknown',
      isGroup: chat.isGroup,
      timestamp: chat.timestamp
    }));
  } catch (error) {
    console.error('Error getting contact chats:', error);
    return [];
  }
}

// Get last interaction with a contact
async function getLastInteraction(jid) {
  try {
    let targetChat;
    
    try {
      targetChat = await client.getChatById(jid);
    } catch {
      // If we can't get the chat directly, look through all chats
      const allChats = await client.getChats();
      targetChat = allChats.find(chat => {
        if (chat.isGroup) {
          return chat.participants && chat.participants.some(p => p.id._serialized === jid);
        } else {
          return chat.id._serialized === jid;
        }
      });
      
      if (!targetChat) {
        return null;
      }
    }
    
    const messages = await targetChat.fetchMessages({ limit: 1 });
    if (messages.length > 0) {
      return {
        id: messages[0].id._serialized,
        body: messages[0].body,
        timestamp: messages[0].timestamp,
        from: messages[0].from,
        to: messages[0].to
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last interaction:', error);
    return null;
  }
}

// Get context around a specific message
async function getMessageContext(message_id, before = 5, after = 5) {
  try {
    // We need to find which chat contains this message
    const allChats = await client.getChats();
    
    for (const chat of allChats) {
      const messages = await chat.fetchMessages({ limit: 30 });
      const targetMsgIndex = messages.findIndex(msg => msg.id._serialized === message_id);
      
      if (targetMsgIndex !== -1) {
        // Found the message
        const startIndex = Math.max(0, targetMsgIndex - before);
        const endIndex = Math.min(messages.length, targetMsgIndex + after + 1);
        const contextMessages = messages.slice(startIndex, endIndex);
        
        return {
          chat: {
            id: chat.id._serialized,
            name: chat.name
          },
          targetMessage: {
            id: messages[targetMsgIndex].id._serialized,
            body: messages[targetMsgIndex].body,
            timestamp: messages[targetMsgIndex].timestamp,
            from: messages[targetMsgIndex].from,
            to: messages[targetMsgIndex].to
          },
          contextMessages: contextMessages.map(msg => ({
            id: msg.id._serialized,
            body: msg.body,
            timestamp: msg.timestamp,
            from: msg.from,
            to: msg.to,
            isTargetMessage: msg.id._serialized === message_id
          }))
        };
      }
    }
    
    return null; // Message not found
  } catch (error) {
    console.error('Error getting message context:', error);
    return null;
  }
}

// Send a message
async function sendMessage(recipient, message) {
  try {
    const jid = formatJid(recipient);
    await client.sendMessage(jid, message);
    return [true, "Message sent successfully"];
  } catch (error) {
    console.error('Error sending message:', error);
    return [false, `Failed to send message: ${error.message}`];
  }
}

// Send a file
async function sendFile(recipient, mediaPath) {
  try {
    const jid = formatJid(recipient);
    const media = MessageMedia.fromFilePath(mediaPath);
    await client.sendMessage(jid, media);
    return [true, "File sent successfully"];
  } catch (error) {
    console.error('Error sending file:', error);
    return [false, `Failed to send file: ${error.message}`];
  }
}

// Send an audio message
async function sendAudioMessage(recipient, mediaPath) {
  try {
    const jid = formatJid(recipient);
    const media = MessageMedia.fromFilePath(mediaPath);
    await client.sendMessage(jid, media, { sendAudioAsVoice: true });
    return [true, "Audio message sent successfully"];
  } catch (error) {
    console.error('Error sending audio message:', error);
    return [false, `Failed to send audio message: ${error.message}`];
  }
}

// Download media from a message
async function downloadMedia(message_id, chat_jid) {
  try {
    const chat = await client.getChatById(chat_jid);
    const messages = await chat.fetchMessages({ limit: 50 });
    const targetMsg = messages.find(msg => msg.id._serialized === message_id);
    
    if (!targetMsg || !targetMsg.hasMedia) {
      return null;
    }
    
    const media = await targetMsg.downloadMedia();
    
    if (!media) {
      return null;
    }
    
    // Create downloads directory if it doesn't exist
    const downloadDir = path.join(__dirname, '..', 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // Generate a filename based on message ID and mimetype
    const extension = media.mimetype.split('/')[1] || 'dat';
    const filename = `${message_id.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
    const filePath = path.join(downloadDir, filename);
    
    // Write the file
    fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
    
    return filePath;
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
}

module.exports = {
  searchContacts,
  listMessages,
  listChats,
  getChat,
  getDirectChatByContact,
  getContactChats,
  getLastInteraction,
  getMessageContext,
  sendMessage,
  sendFile,
  sendAudioMessage,
  downloadMedia
}; 