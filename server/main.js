const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const whatsapp = require('./whatsapp');

// Initialize Express server
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware with more specific CORS settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Define routes for MCP tools
app.post('/mcp/tools/search_contacts', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const contacts = await whatsapp.searchContacts(query);
    return res.json(contacts);
  } catch (error) {
    console.error('Error in search_contacts:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/list_messages', async (req, res) => {
  try {
    const {
      after,
      before,
      sender_phone_number,
      chat_jid,
      query,
      limit,
      page,
      include_context,
      context_before,
      context_after
    } = req.body;
    
    const messages = await whatsapp.listMessages({
      after,
      before,
      sender_phone_number,
      chat_jid,
      query,
      limit,
      page,
      include_context,
      context_before,
      context_after
    });
    
    return res.json(messages);
  } catch (error) {
    console.error('Error in list_messages:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/list_chats', async (req, res) => {
  try {
    const {
      query,
      limit,
      page,
      include_last_message,
      sort_by
    } = req.body;
    
    const chats = await whatsapp.listChats({
      query,
      limit,
      page,
      include_last_message,
      sort_by
    });
    
    return res.json(chats);
  } catch (error) {
    console.error('Error in list_chats:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/get_chat', async (req, res) => {
  try {
    const { chat_jid, include_last_message } = req.body;
    
    if (!chat_jid) {
      return res.status(400).json({ error: 'chat_jid parameter is required' });
    }
    
    const chat = await whatsapp.getChat(chat_jid, include_last_message);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    return res.json(chat);
  } catch (error) {
    console.error('Error in get_chat:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/get_direct_chat_by_contact', async (req, res) => {
  try {
    const { sender_phone_number } = req.body;
    
    if (!sender_phone_number) {
      return res.status(400).json({ error: 'sender_phone_number parameter is required' });
    }
    
    const chat = await whatsapp.getDirectChatByContact(sender_phone_number);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    return res.json(chat);
  } catch (error) {
    console.error('Error in get_direct_chat_by_contact:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/get_contact_chats', async (req, res) => {
  try {
    const { jid, limit, page } = req.body;
    
    if (!jid) {
      return res.status(400).json({ error: 'jid parameter is required' });
    }
    
    const chats = await whatsapp.getContactChats(jid, limit, page);
    return res.json(chats);
  } catch (error) {
    console.error('Error in get_contact_chats:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/get_last_interaction', async (req, res) => {
  try {
    const { jid } = req.body;
    
    if (!jid) {
      return res.status(400).json({ error: 'jid parameter is required' });
    }
    
    const interaction = await whatsapp.getLastInteraction(jid);
    
    if (!interaction) {
      return res.status(404).json({ error: 'No interaction found' });
    }
    
    return res.json(interaction);
  } catch (error) {
    console.error('Error in get_last_interaction:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/get_message_context', async (req, res) => {
  try {
    const { message_id, before, after } = req.body;
    
    if (!message_id) {
      return res.status(400).json({ error: 'message_id parameter is required' });
    }
    
    const context = await whatsapp.getMessageContext(message_id, before, after);
    
    if (!context) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    return res.json(context);
  } catch (error) {
    console.error('Error in get_message_context:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/send_message', async (req, res) => {
  try {
    const { recipient, message } = req.body;
    
    if (!recipient || !message) {
      return res.status(400).json({ error: 'recipient and message parameters are required' });
    }
    
    const [success, statusMessage] = await whatsapp.sendMessage(recipient, message);
    
    return res.json({
      success,
      message: statusMessage
    });
  } catch (error) {
    console.error('Error in send_message:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/send_file', async (req, res) => {
  try {
    const { recipient, media_path } = req.body;
    
    if (!recipient || !media_path) {
      return res.status(400).json({ error: 'recipient and media_path parameters are required' });
    }
    
    const [success, statusMessage] = await whatsapp.sendFile(recipient, media_path);
    
    return res.json({
      success,
      message: statusMessage
    });
  } catch (error) {
    console.error('Error in send_file:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/send_audio_message', async (req, res) => {
  try {
    const { recipient, media_path } = req.body;
    
    if (!recipient || !media_path) {
      return res.status(400).json({ error: 'recipient and media_path parameters are required' });
    }
    
    const [success, statusMessage] = await whatsapp.sendAudioMessage(recipient, media_path);
    
    return res.json({
      success,
      message: statusMessage
    });
  } catch (error) {
    console.error('Error in send_audio_message:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/download_media', async (req, res) => {
  try {
    const { message_id, chat_jid } = req.body;
    
    if (!message_id || !chat_jid) {
      return res.status(400).json({ error: 'message_id and chat_jid parameters are required' });
    }
    
    const filePath = await whatsapp.downloadMedia(message_id, chat_jid);
    
    if (!filePath) {
      return res.json({
        success: false,
        message: 'Failed to download media'
      });
    }
    
    return res.json({
      success: true,
      message: 'Media downloaded successfully',
      file_path: filePath
    });
  } catch (error) {
    console.error('Error in download_media:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`WhatsApp MCP server running on port ${PORT}`);
}); 