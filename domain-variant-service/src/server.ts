// Domain Variant Service - Main Server
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dns from 'dns';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { generateDomainVariants } from './variantGenerator';
import { config } from './config';
import { logger } from './logger';
import {
  validateDomainGeneration,
  validateScanRequest,
  validateReportRequest,
  handleValidationErrors,
} from './validators';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: config.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use('/api/', limiter);

// In-memory storage (TODO: Replace with database)
interface ScanData {
  variants: string[];
  status: 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
}

interface ScanResult {
  domain: string;
  dnsResolved: boolean;
  httpStatus: number | null;
  error: string | null;
  status: 'scanned' | 'unreachable';
  scannedAt: Date;
}

const scans: Record<string, ScanData> = {};
const scanResults: Record<string, ScanResult[]> = {};

// Data retention configuration: clean up old scans after 24 hours
const DATA_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup function to remove old scan and report data
function cleanupOldScans(): void {
  const now = new Date();
  let cleanedScansCount = 0;
  let cleanedReportsCount = 0;

  // Clean up old scans
  for (const [scanId, scanData] of Object.entries(scans)) {
    const age = now.getTime() - scanData.createdAt.getTime();
    if (age > DATA_RETENTION_MS) {
      delete scans[scanId];
      delete scanResults[scanId];
      cleanedScansCount++;
    }
  }

  // Clean up old reports (defined later in code but accessed via closure)
  if (typeof reports !== 'undefined') {
    for (const [reportId, reportData] of Object.entries(reports)) {
      const age = now.getTime() - reportData.createdAt.getTime();
      if (age > DATA_RETENTION_MS) {
        delete reports[reportId];
        cleanedReportsCount++;
      }
    }
  }

  if (cleanedScansCount > 0 || cleanedReportsCount > 0) {
    logger.info('Cleaned up old data', {
      scans: cleanedScansCount,
      reports: cleanedReportsCount,
    });
  }
}

// Run cleanup every hour
setInterval(cleanupOldScans, 60 * 60 * 1000);

// Helper function to generate unique IDs using cryptographically secure random bytes
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

// Helper function for DNS lookup with timeout
async function dnsLookup(hostname: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);

    dns.lookup(hostname, (err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });
}

// Helper function for HTTP request with timeout
async function httpCheck(
  url: string,
  timeoutMs: number
): Promise<{ status: number | null; error: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal as any,
      redirect: 'manual',
    });

    clearTimeout(timeout);
    return { status: response.status, error: null };
  } catch (error: any) {
    return { status: null, error: error.message || 'HTTP request failed' };
  }
}

// API Routes

// Health check endpoint with rate limiting
app.get('/health', limiter, (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
  });
});

// Generate domain variants
app.post(
  `/api/${config.apiVersion}/domains/variants/generate`,
  validateDomainGeneration,
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { domain } = req.body;

    try {
      logger.info('Generating variants', { domain });
      const variants = generateDomainVariants(domain);

      logger.info('Variants generated', {
        domain,
        count: variants.length,
      });

      res.json({
        data: { variants },
        meta: {
          timestamp: new Date().toISOString(),
          version: config.apiVersion,
        },
      });
    } catch (error: any) {
      logger.error('Error generating variants', {
        domain,
        error: error.message,
        ...(config.nodeEnv === 'development' && { stack: error.stack }),
      });

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate domain variants',
        },
      });
    }
  }
);

// Create and execute scan job
app.post(
  `/api/${config.apiVersion}/scans`,
  validateScanRequest,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { variants } = req.body;
    const scanId = generateId('scan');

    try {
      logger.info('Starting scan', { scanId, variantCount: variants.length });

      scans[scanId] = {
        variants,
        status: 'in_progress',
        createdAt: new Date(),
      };

      // Perform DNS and HTTP checks for each variant
      const results: ScanResult[] = await Promise.all(
        variants.map(async (variant: string) => {
          let dnsResolved = false;
          let httpStatus: number | null = null;
          let error: string | null = null;

          try {
            // Remove protocol if present
            const hostname = variant.replace(/^https?:\/\//, '');

            // DNS lookup
            dnsResolved = await dnsLookup(hostname, config.scanning.dnsTimeoutMs);

            if (!dnsResolved) {
              error = 'DNS lookup failed';
            }
          } catch (e: any) {
            error = `DNS error: ${e.message}`;
            logger.debug('DNS lookup error', { variant, error: e.message });
          }

          // HTTP check if DNS resolved
          if (dnsResolved) {
            try {
              const url = variant.startsWith('http') ? variant : `http://${variant}`;
              const result = await httpCheck(url, config.scanning.httpTimeoutMs);
              httpStatus = result.status;
              if (result.error) {
                error = result.error;
              }
            } catch (e: any) {
              error = `HTTP error: ${e.message}`;
              logger.debug('HTTP check error', { variant, error: e.message });
            }
          }

          return {
            domain: variant,
            dnsResolved,
            httpStatus,
            error,
            status: dnsResolved ? 'scanned' : 'unreachable',
            scannedAt: new Date(),
          } as ScanResult;
        })
      );

      scans[scanId].status = 'completed';
      scanResults[scanId] = results;

      logger.info('Scan completed', {
        scanId,
        totalVariants: variants.length,
        resolved: results.filter((r) => r.dnsResolved).length,
        unreachable: results.filter((r) => !r.dnsResolved).length,
      });

      res.json({
        data: { scanId },
        meta: {
          timestamp: new Date().toISOString(),
          version: config.apiVersion,
        },
      });
    } catch (error: any) {
      scans[scanId].status = 'failed';
      logger.error('Scan failed', {
        scanId,
        error: error.message,
        ...(config.nodeEnv === 'development' && { stack: error.stack }),
      });

      res.status(500).json({
        error: {
          code: 'SCAN_FAILED',
          message: 'Failed to complete scan',
        },
      });
    }
  }
);

// Get scan results
app.get(`/api/${config.apiVersion}/scans/:id/results`, (req: Request, res: Response): void => {
  const { id } = req.params;

  if (!scanResults[id]) {
    logger.warn('Scan results not found', { scanId: id });
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Scan results not found',
      },
    });
    return;
  }

  logger.info('Retrieving scan results', { scanId: id });

  res.json({
    data: { results: scanResults[id] },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.apiVersion,
      scanStatus: scans[id]?.status || 'unknown',
    },
  });
});

// In-memory report storage with metadata
interface ReportData {
  scanId: string;
  createdAt: Date;
}
const reports: Record<string, ReportData> = {};

// Generate report
app.post(
  `/api/${config.apiVersion}/reports`,
  validateReportRequest,
  handleValidationErrors,
  (req: Request, res: Response): void => {
    const { scanId } = req.body;

    if (!scanResults[scanId]) {
      logger.warn('Cannot generate report, scan not found', { scanId });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid or missing scanId',
        },
      });
      return;
    }

    const reportId = generateId('report');
    reports[reportId] = {
      scanId,
      createdAt: new Date(),
    };
    logger.info('Report generated', { reportId, scanId });

    res.json({
      data: { reportId, scanId },
      meta: {
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    });
  }
);

// Download report
app.get(`/api/${config.apiVersion}/reports/:id/download`, (req: Request, res: Response): void => {
  const { id } = req.params;

  // Validate report ID format and existence
  if (!id || !id.startsWith('report_') || !reports[id]) {
    logger.warn('Invalid or non-existent report ID', { reportId: id });
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Report not found',
      },
    });
    return;
  }

  const reportData = reports[id];
  logger.info('Downloading report', { reportId: id, scanId: reportData.scanId });

  // Generate HTML report
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Domain Security Scan Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
          }
          h2 {
            color: #555;
            margin-top: 30px;
          }
          .metadata {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .metadata p {
            margin: 5px 0;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          tr:hover {
            background-color: #e8e8e8;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #777;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Domain Security Scan Report</h1>

          <div class="metadata">
            <p><strong>Report ID:</strong> ${id}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Service Version:</strong> ${config.apiVersion}</p>
          </div>

          <h2>Summary</h2>
          <p>
            This report contains the results of a comprehensive security scan for potentially
            malicious domain variants. The scan checks for typosquatting, cybersquatting, and
            other domain-based threats.
          </p>

          <h2>Scan Details</h2>
          <p>
            This is a sample report generated by the Domain Monitor service. In a production
            environment, this report would include comprehensive details about each domain scanned,
            including DNS resolution status, HTTP response codes, SSL certificate information,
            WHOIS data, and threat intelligence indicators.
          </p>

          <div class="footer">
            <p>Generated by Domain Monitor Service v${config.apiVersion}</p>
            <p>&copy; ${new Date().getFullYear()} - For authorized use only</p>
          </div>
        </div>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename=report-${id}.html`);
  res.send(html);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    },
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Domain Variant Service started`, {
    port: config.port,
    environment: config.nodeEnv,
    apiVersion: config.apiVersion,
  });
});

export default app;
