// Input validation middleware
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation rules
export const validateDomainGeneration = [
  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain is required')
    .isLength({ min: 2, max: 253 })
    .withMessage('Domain must be between 2 and 253 characters')
    .matches(/^[a-zA-Z0-9\-\.]+$/)
    .withMessage('Domain contains invalid characters'),
];

export const validateScanRequest = [
  body('variants')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Variants must be an array with 1-1000 items'),
  body('variants.*')
    .trim()
    .notEmpty()
    .withMessage('Each variant must be a non-empty string')
    .isLength({ max: 253 })
    .withMessage('Each variant must be less than 253 characters'),
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
