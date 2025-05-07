const axios = require('axios');

class WhatsAppClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // Helper method to make API requests
  async _makeRequest(endpoint, data) {
    try {
      const response = await axios.post(`${this.baseUrl}/mcp/tools/${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Search contacts
  async searchContacts(query) {
    return this._makeRequest('search_contacts', { query });
  }

  // List messages with optional filters
  async listMessages(options = {}) {
    return this._makeRequest('list_messages', options);
  }

  // List chats with optional filters
  async listChats(options = {}) {
    return this._makeRequest('list_chats', options);
  }

  // Get chat by JID
  async getChat(chatJid, includeLastMessage = true) {
    return this._makeRequest('get_chat', { 
      chat_jid: chatJid, 
      include_last_message: includeLastMessage 
    });
  }

  // Get direct chat by contact phone number
  async getDirectChatByContact(phoneNumber) {
    return this._makeRequest('get_direct_chat_by_contact', {
      sender_phone_number: phoneNumber
    });
  }

  // Get all chats involving a contact
  async getContactChats(jid, limit = 20, page = 0) {
    return this._makeRequest('get_contact_chats', { jid, limit, page });
  }

  // Get last interaction with a contact
  async getLastInteraction(jid) {
    return this._makeRequest('get_last_interaction', { jid });
  }

  // Get context around a specific message
  async getMessageContext(messageId, before = 5, after = 5) {
    return this._makeRequest('get_message_context', { 
      message_id: messageId,
      before,
      after
    });
  }

  // Send a text message
  async sendMessage(recipient, message) {
    return this._makeRequest('send_message', { recipient, message });
  }

  // Send a file (image, video, document)
  async sendFile(recipient, mediaPath) {
    return this._makeRequest('send_file', { recipient, media_path: mediaPath });
  }

  // Send an audio message
  async sendAudioMessage(recipient, mediaPath) {
    return this._makeRequest('send_audio_message', { recipient, media_path: mediaPath });
  }

  // Download media from a message
  async downloadMedia(messageId, chatJid) {
    return this._makeRequest('download_media', { message_id: messageId, chat_jid: chatJid });
  }
}

// Example usage
async function example() {
  const client = new WhatsAppClient();
  
  try {
    // Search for a contact
    const contacts = await client.searchContacts('John');
    console.log('Contacts:', contacts);

    if (contacts.length > 0) {
      const contact = contacts[0];
      
      // Send a message to the first contact
      const sendResult = await client.sendMessage(contact.id, 'Hello from WhatsApp MCP client!');
      console.log('Message send result:', sendResult);
      
      // List recent chats
      const chats = await client.listChats({ limit: 5 });
      console.log('Recent chats:', chats);
      
      if (chats.length > 0) {
        // Get messages from the first chat
        const messages = await client.listMessages({ 
          chat_jid: chats[0].id,
          limit: 5
        });
        console.log('Recent messages from first chat:', messages);
        
        if (messages.length > 0 && messages[0].hasMedia) {
          // Download media from the first message that has media
          const mediaResult = await client.downloadMedia(messages[0].id, chats[0].id);
          console.log('Media download result:', mediaResult);
        }
      }
    }
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run the example
// example();

module.exports = WhatsAppClient; 