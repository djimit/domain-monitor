// Input validation middleware
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Custom validator function for proper domain format
const isValidDomain = (value: string): boolean => {
  // Check for null bytes, control characters, and other dangerous characters
  if (/[\x00-\x1F\x7F-\x9F]/.test(value)) {
    return false;
  }

  // Remove protocol if present for validation
  const domain = value.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

  // Domain must contain only alphanumeric, dots, and hyphens
  if (!/^[a-z0-9.-]+$/i.test(domain)) {
    return false;
  }

  // Check for invalid patterns
  if (
    domain.startsWith('.') || domain.endsWith('.') ||     // Leading/trailing dots
    domain.startsWith('-') || domain.endsWith('-') ||     // Leading/trailing hyphens
    domain.includes('..') ||                               // Consecutive dots
    domain.includes('.-') || domain.includes('-.') ||      // Invalid dot-hyphen combinations
    domain.includes('--')                                  // Consecutive hyphens (except IDN)
  ) {
    return false;
  }

  // Validate each label (part between dots)
  const labels = domain.split('.');
  for (const label of labels) {
    // Each label must be 1-63 characters
    if (label.length === 0 || label.length > 63) {
      return false;
    }
    // Label cannot start or end with hyphen
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }

  // Must have at least one dot for a valid domain (e.g., example.com)
  if (labels.length < 2) {
    return false;
  }

  // TLD must be at least 2 characters and alphabetic
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return false;
  }

  return true;
};

// Custom validator to prevent SSRF attacks
const isSafeUrl = (value: string): boolean => {
  // Only allow http and https protocols (explicitly checked)
  if (value.includes('://')) {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return false;
    }
  }

  // Prevent access to private IP ranges and localhost
  const domain = value.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

  // Block localhost and local domains
  if (
    domain.toLowerCase() === 'localhost' ||
    domain.toLowerCase() === '0.0.0.0' ||
    domain.startsWith('127.') ||
    domain.startsWith('169.254.') ||    // Link-local
    domain.endsWith('.local') ||
    domain.endsWith('.localhost')
  ) {
    return false;
  }

  // Block private IP ranges (basic check)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = domain.match(ipv4Regex);
  if (ipMatch) {
    const octets = ipMatch.slice(1).map(Number);
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    ) {
      return false;
    }
  }

  return true;
};

// Validation rules
export const validateDomainGeneration = [
  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain is required')
    .isLength({ min: 2, max: 253 })
    .withMessage('Domain must be between 2 and 253 characters')
    .custom(isValidDomain)
    .withMessage('Invalid domain format or contains dangerous characters'),
];

export const validateScanRequest = [
  body('variants')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Variants must be an array with 1-1000 items'),
  body('variants.*')
    .trim()
    .notEmpty()
    .withMessage('Each variant must be a non-empty string')
    .isLength({ min: 2, max: 253 })
    .withMessage('Each variant must be between 2 and 253 characters')
    .custom(isValidDomain)
    .withMessage('Invalid domain format or contains dangerous characters')
    .custom(isSafeUrl)
    .withMessage('URL contains unsafe protocol or targets internal resources'),
];

export const validateReportRequest = [
  body('scanId')
    .trim()
    .notEmpty()
    .withMessage('Scan ID is required')
    .matches(/^scan_[a-z0-9]+$/)
    .withMessage('Invalid scan ID format'),
];

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
    });
    return;
  }
  next();
};
