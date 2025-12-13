const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Configure CORS - restrict to localhost for development/testing
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test route
app.get('/api/v1/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

// Mock variant generation endpoint
app.post('/api/v1/domains/variants/generate', (req, res) => {
  const { domain } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid domain' } });
  }

  // Send a simple response with mock variants
  const mockVariants = [
    `${domain}1.com`,
    `${domain}2.com`,
    `1${domain}.com`,
    `www-${domain}.com`
  ];

  res.json({
    data: { variants: mockVariants },
    meta: { timestamp: new Date().toISOString(), version: '1.0' }
  });
});

app.listen(PORT, () => {
  // Test server started
});