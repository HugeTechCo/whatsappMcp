const WhatsAppClient = require('./whatsapp-client');

async function main() {
  const client = new WhatsAppClient();
  
  try {
    // Search for contacts with "John" in their name or number
    const searchTerm = 'John';
    console.log(`Searching for contacts with "${searchTerm}" in their name or number...`);
    
    const contacts = await client.searchContacts(searchTerm);
    
    if (contacts.length === 0) {
      console.log('No contacts found matching the search term.');
    } else {
      console.log(`Found ${contacts.length} contacts:`);
      contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} (${contact.number || 'No number'}) - ID: ${contact.id}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 