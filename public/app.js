document.addEventListener('DOMContentLoaded', () => {
  // API URL
  const API_URL = 'http://localhost:3001/mcp/tools';
  
  // DOM Elements
  const chatListEl = document.getElementById('chat-list');
  const chatHeaderEl = document.getElementById('chat-header');
  const messagesContainerEl = document.getElementById('messages-container');
  const messageInputEl = document.getElementById('message-input');
  const sendBtnEl = document.getElementById('send-btn');
  const searchInputEl = document.getElementById('search-input');
  const searchBtnEl = document.getElementById('search-btn');
  
  // Current state
  let currentChatId = null;
  
  // Helper function for API calls with better error handling
  async function apiCall(endpoint, data = {}) {
    try {
      console.log(`Making API call to ${endpoint} with data:`, data);
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`API response from ${endpoint}:`, result);
      return result;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  // Load chats
  async function loadChats() {
    try {
      chatListEl.innerHTML = '<div class="loading">Loading chats...</div>';
      
      const chats = await apiCall('list_chats', {
        limit: 20,
        include_last_message: true,
        sort_by: 'last_active'
      });
      
      if (chats.length === 0) {
        chatListEl.innerHTML = '<div class="no-chat">No chats found</div>';
        return;
      }
      
      chatListEl.innerHTML = '';
      
      chats.forEach(chat => {
        const lastMessageText = chat.lastMessage ? 
          (chat.lastMessage.body || (chat.lastMessage.hasMedia ? '[Media]' : '[Empty]')) : 
          'No messages';
        
        const chatEl = document.createElement('div');
        chatEl.className = 'chat-item';
        chatEl.dataset.chatId = chat.id;
        chatEl.innerHTML = `
          <div class="chat-item-name">${chat.name} ${chat.isGroup ? '(Group)' : ''}</div>
          <div class="chat-item-last-message">${lastMessageText}</div>
        `;
        
        chatEl.addEventListener('click', () => selectChat(chat));
        
        chatListEl.appendChild(chatEl);
      });
    } catch (error) {
      console.error('Error loading chats:', error);
      chatListEl.innerHTML = `<div class="error">Error loading chats: ${error.message}</div>`;
    }
  }
  
  // Select chat
  function selectChat(chat) {
    // Update UI
    document.querySelectorAll('.chat-item').forEach(el => {
      el.classList.remove('active');
    });
    
    const selectedChatEl = document.querySelector(`.chat-item[data-chat-id="${chat.id}"]`);
    if (selectedChatEl) {
      selectedChatEl.classList.add('active');
    }
    
    currentChatId = chat.id;
    chatHeaderEl.innerHTML = `<h2>${chat.name} ${chat.isGroup ? '(Group)' : ''}</h2>`;
    
    // Enable message input
    messageInputEl.disabled = false;
    sendBtnEl.disabled = false;
    
    // Load messages
    loadMessages(chat.id);
  }
  
  // Load messages
  async function loadMessages(chatId) {
    try {
      messagesContainerEl.innerHTML = '<div class="loading">Loading messages...</div>';
      
      const messages = await apiCall('list_messages', {
        chat_jid: chatId,
        limit: 20
      });
      
      if (messages.length === 0) {
        messagesContainerEl.innerHTML = '<div class="no-chat">No messages found</div>';
        return;
      }
      
      messagesContainerEl.innerHTML = '';
      
      // Get your own ID to determine message direction
      const myInfo = localStorage.getItem('myInfo');
      let myId = null;
      
      if (myInfo) {
        try {
          myId = JSON.parse(myInfo).id;
        } catch (e) {
          console.error('Error parsing myInfo:', e);
        }
      }
      
      messages.forEach(message => {
        const isFromMe = myId ? message.from === myId : false;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isFromMe ? 'message-sent' : 'message-received'}`;
        
        // Format timestamp
        const date = new Date(message.timestamp * 1000);
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedDate = date.toLocaleDateString();
        
        messageEl.innerHTML = `
          ${!isFromMe ? `<div class="message-sender">${message.from.split('@')[0]}</div>` : ''}
          <div class="message-content">${message.body || (message.hasMedia ? '[Media]' : '[Empty]')}</div>
          <div class="message-timestamp">${formattedTime} | ${formattedDate}</div>
        `;
        
        messagesContainerEl.appendChild(messageEl);
      });
      
      // Scroll to bottom
      messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
    } catch (error) {
      console.error('Error loading messages:', error);
      messagesContainerEl.innerHTML = '<div class="error">Error loading messages. Please try again.</div>';
    }
  }
  
  // Send message
  async function sendMessage(chatId, message) {
    try {
      if (!message.trim()) return;
      
      messageInputEl.disabled = true;
      sendBtnEl.disabled = true;
      
      const result = await apiCall('send_message', {
        recipient: chatId,
        message: message
      });
      
      if (result.success) {
        // Clear input
        messageInputEl.value = '';
        
        // Reload messages
        loadMessages(chatId);
      } else {
        alert(`Failed to send message: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message}`);
    } finally {
      messageInputEl.disabled = false;
      sendBtnEl.disabled = false;
    }
  }
  
  // Search chats
  async function searchChats(query) {
    try {
      if (!query.trim()) {
        loadChats();
        return;
      }
      
      chatListEl.innerHTML = '<div class="loading">Searching...</div>';
      
      const chats = await apiCall('list_chats', {
        query: query,
        limit: 20,
        include_last_message: true
      });
      
      if (chats.length === 0) {
        chatListEl.innerHTML = '<div class="no-chat">No chats found matching your search</div>';
        return;
      }
      
      chatListEl.innerHTML = '';
      
      chats.forEach(chat => {
        const lastMessageText = chat.lastMessage ? 
          (chat.lastMessage.body || (chat.lastMessage.hasMedia ? '[Media]' : '[Empty]')) : 
          'No messages';
        
        const chatEl = document.createElement('div');
        chatEl.className = 'chat-item';
        chatEl.dataset.chatId = chat.id;
        chatEl.innerHTML = `
          <div class="chat-item-name">${chat.name} ${chat.isGroup ? '(Group)' : ''}</div>
          <div class="chat-item-last-message">${lastMessageText}</div>
        `;
        
        chatEl.addEventListener('click', () => selectChat(chat));
        
        chatListEl.appendChild(chatEl);
      });
    } catch (error) {
      console.error('Error searching chats:', error);
      chatListEl.innerHTML = '<div class="error">Error searching chats. Please try again.</div>';
    }
  }
  
  // Event listeners
  sendBtnEl.addEventListener('click', () => {
    if (currentChatId) {
      sendMessage(currentChatId, messageInputEl.value);
    }
  });
  
  messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && currentChatId) {
      sendMessage(currentChatId, messageInputEl.value);
    }
  });
  
  searchBtnEl.addEventListener('click', () => {
    searchChats(searchInputEl.value);
  });
  
  searchInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchChats(searchInputEl.value);
    }
  });
  
  // Initial load with error handling
  try {
    loadChats();
  } catch (error) {
    console.error('Initial load failed:', error);
    chatListEl.innerHTML = `<div class="error">Failed to connect to WhatsApp MCP server: ${error.message}</div>`;
  }
}); 