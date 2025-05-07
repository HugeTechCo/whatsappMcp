const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.WEB_PORT || 8080;

// Enable CORS
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Web Server] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route all requests to the index.html file (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Web server running at http://localhost:${PORT}`);
}); 