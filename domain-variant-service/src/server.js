const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { generateDomainVariants } = require('./variantGenerator');
const dns = require('dns');
const fetch = require('node-fetch');
const { AbortController } = require('abort-controller');

const app = express();
const PORT = 3001;

// Configure CORS for all routes - restrict to localhost for development
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add a simple test route
app.get('/api/v1/test', (req, res) => {
  res.json({ status: 'ok', message: 'Domain Variant Service is running' });
});

// In-memory store for scans and results (mock)
const scans = {};
const scanResults = {};

app.post('/api/v1/domains/variants/generate', (req, res) => {
  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid domain' } });
  }
  try {
    const variants = generateDomainVariants(domain);
    res.json({
      data: { variants },
      meta: { timestamp: new Date().toISOString(), version: '1.0' }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate variants' } });
  }
});

// Create scan job
app.post('/api/v1/scans', async (req, res) => {
  const { variants } = req.body;
  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid variants' } });
  }
  const scanId = 'scan_' + crypto.randomBytes(16).toString('hex');
  scans[scanId] = { variants, status: 'in_progress' };

  // Perform DNS and HTTP checks for each variant
  const results = await Promise.all(
    variants.map(async (v) => {
      let dnsResolved = false;
      let httpStatus = null;
      let error = null;
      try {
        // DNS lookup
        const host = v.replace(/^https?:\/\//, '');
        await dns.promises.lookup(host);
        dnsResolved = true;
      } catch (e) {
        error = 'DNS lookup failed';
      }
      if (dnsResolved) {
        try {
          const url = v.startsWith('http') ? v : `http://${v}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
          clearTimeout(timeout);
          httpStatus = resp.status;
        } catch (e) {
          error = 'HTTP fetch failed';
        }
      }
      return {
        domain: v,
        dnsResolved,
        httpStatus,
        error,
        status: dnsResolved ? 'scanned' : 'unreachable'
      };
    })
  ).catch(() => {
    // Catch any unexpected errors in the Promise.all
    return [];
  });
  
  scans[scanId].status = 'completed';
  scanResults[scanId] = results;
  res.json({ data: { scanId } });
});

// Get scan results
app.get('/api/v1/scans/:id/results', (req, res) => {
  const { id } = req.params;
  if (!scanResults[id]) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan results not found' } });
  }
  res.json({ data: { results: scanResults[id] } });
});

// Report generation endpoints
app.post('/api/v1/reports', (req, res) => {
  const { scanId } = req.body;
  if (!scanId || !scanResults[scanId]) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid or missing scanId' } });
  }
  const reportId = 'report_' + crypto.randomBytes(16).toString('hex');
  res.json({ data: { reportId } });
});

// Download report endpoint
app.get('/api/v1/reports/:id/download', (req, res) => {
  const { id } = req.params;
  if (!id || !id.startsWith('report_')) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
  }
  
  // Generate a simple HTML report
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Domain Scan Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          th { padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <h1>Domain Security Scan Report</h1>
        <p>Report ID: ${id}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <h2>Summary</h2>
        <p>This report contains the results of a security scan for potentially malicious domain variants.</p>
        <h2>Details</h2>
        <p>This is a sample report. In a production environment, this would include comprehensive details about each domain scanned.</p>
      </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename=report-${id}.html`);
  res.send(html);
});

// Add error handling for server startup
const server = app.listen(PORT, () => {
  // Server started successfully
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

process.on('uncaughtException', () => {
  process.exit(1);
});