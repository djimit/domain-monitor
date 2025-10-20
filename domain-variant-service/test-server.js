const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test route
app.get('/api/v1/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ status: 'ok', message: 'Test server is running' });
});

// Mock variant generation endpoint
app.post('/api/v1/domains/variants/generate', (req, res) => {
  console.log('Received request to generate variants:', req.body);
  const { domain } = req.body;
  
  if (!domain || typeof domain !== 'string') {
    console.log('Validation error: domain is missing or not a string');
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid domain' } });
  }
  
  // Send a simple response with mock variants
  const mockVariants = [
    `${domain}1.com`,
    `${domain}2.com`,
    `1${domain}.com`,
    `www-${domain}.com`
  ];
  
  console.log(`Generated ${mockVariants.length} mock variants`);
  res.json({
    data: { variants: mockVariants },
    meta: { timestamp: new Date().toISOString(), version: '1.0' }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});