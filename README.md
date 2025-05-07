# WhatsApp MCP Server

This project provides a MCP (Messaging Control Protocol) server implementation for WhatsApp, inspired by [lharries/whatsapp-mcp](https://github.com/lharries/whatsapp-mcp).

## Overview

The WhatsApp MCP server allows you to programmatically interact with WhatsApp Web through a REST API, providing endpoints for:

- Searching contacts
- Listing and fetching messages
- Sending text messages, files, and audio messages
- Managing chats
- Downloading media

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- A WhatsApp account

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd whatsapp-mcp
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Server

1. Start the server:
   ```
   npm start
   ```

2. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Tap Menu or Settings
   - Select WhatsApp Web
   - Point your phone at the QR code displayed in the console

3. The server will be available at `http://localhost:3001`

### Web Interface

The project includes a simple web interface for interacting with WhatsApp:

1. Start the web server:
   ```
   npm run web
   ```

2. Open your browser and navigate to `http://localhost:8080`

3. You can now use the web interface to:
   - View your chats
   - Send and receive messages
   - Search for chats
   - View message history

To start both the WhatsApp MCP server and the web interface at the same time:
```
npm run start-all
```

### Command Line Interface (CLI)

This project includes a simple CLI for interacting with the WhatsApp MCP server:

```
npm run cli
```

The CLI provides the following options:
- Search contacts
- List chats
- List messages from a chat
- Send a message
- Send a file
- Download media from a message
- Get message context

### JavaScript Client

You can also use the provided JavaScript client in your own applications:

```javascript
const WhatsAppClient = require('./client/whatsapp-client');

async function example() {
  const client = new WhatsAppClient();
  
  // Search for contacts
  const contacts = await client.searchContacts('John');
  console.log(contacts);
  
  // Send a message
  const result = await client.sendMessage('1234567890', 'Hello from WhatsApp MCP!');
  console.log(result);
}

example();
```

Run the included example:
```
npm run client-example
```

## API Endpoints

All endpoints use POST method and accept JSON payload.

### Search Contacts

```
POST /mcp/tools/search_contacts
{
  "query": "John"
}
```

### List Messages

```
POST /mcp/tools/list_messages
{
  "after": "2023-01-01T00:00:00Z",  // Optional
  "before": "2023-12-31T23:59:59Z",  // Optional
  "sender_phone_number": "1234567890",  // Optional
  "chat_jid": "1234567890@s.whatsapp.net",  // Optional
  "query": "hello",  // Optional
  "limit": 20,  // Optional
  "page": 0,  // Optional
  "include_context": true,  // Optional
  "context_before": 1,  // Optional
  "context_after": 1  // Optional
}
```

### List Chats

```
POST /mcp/tools/list_chats
{
  "query": "family",  // Optional
  "limit": 20,  // Optional
  "page": 0,  // Optional
  "include_last_message": true,  // Optional
  "sort_by": "last_active"  // Optional, either "last_active" or "name"
}
```

### Get Chat

```
POST /mcp/tools/get_chat
{
  "chat_jid": "1234567890@s.whatsapp.net",
  "include_last_message": true  // Optional
}
```

### Get Direct Chat by Contact

```
POST /mcp/tools/get_direct_chat_by_contact
{
  "sender_phone_number": "1234567890"
}
```

### Get Contact Chats

```
POST /mcp/tools/get_contact_chats
{
  "jid": "1234567890@s.whatsapp.net",
  "limit": 20,  // Optional
  "page": 0  // Optional
}
```

### Get Last Interaction

```
POST /mcp/tools/get_last_interaction
{
  "jid": "1234567890@s.whatsapp.net"
}
```

### Get Message Context

```
POST /mcp/tools/get_message_context
{
  "message_id": "MESSAGE_ID",
  "before": 5,  // Optional
  "after": 5  // Optional
}
```

### Send Message

```
POST /mcp/tools/send_message
{
  "recipient": "1234567890",  // Phone number or JID
  "message": "Hello, world!"
}
```

### Send File

```
POST /mcp/tools/send_file
{
  "recipient": "1234567890",  // Phone number or JID
  "media_path": "/path/to/file.jpg"
}
```

### Send Audio Message

```
POST /mcp/tools/send_audio_message
{
  "recipient": "1234567890",  // Phone number or JID
  "media_path": "/path/to/audio.mp3"
}
```

### Download Media

```
POST /mcp/tools/download_media
{
  "message_id": "MESSAGE_ID",
  "chat_jid": "1234567890@s.whatsapp.net"
}
```

## Notes

- For most endpoints, the `recipient` parameter can be either a phone number (e.g., "1234567890") or a JID (e.g., "1234567890@s.whatsapp.net" for direct chats or something like "1234567890@g.us" for group chats).
- Phone numbers should be provided without any special characters (no +, -, spaces, etc).
- When sending files, use absolute paths for the `media_path` parameter.
- Downloaded media files are stored in the `downloads` directory.

## License

MIT 