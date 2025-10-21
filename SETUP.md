# Domain Monitor - Setup Guide

## Overview

This guide will help you set up and run the Domain Monitor application locally.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd domain-monitor
```

### 2. Install Dependencies

The project uses npm workspaces to manage both frontend and backend:

```bash
# Install all dependencies
npm install
```

This will install dependencies for:
- Root workspace
- domain-monitor-frontend
- domain-variant-service

### 3. Environment Configuration

#### Backend (.env)

Create `.env` file in `domain-variant-service/`:

```bash
cd domain-variant-service
cp .env.example .env
```

Default configuration:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SCAN_TIMEOUT_MS=5000
DNS_TIMEOUT_MS=3000
HTTP_TIMEOUT_MS=5000
```

#### Frontend (.env)

Create `.env` file in `domain-monitor-frontend/`:

```bash
cd domain-monitor-frontend
cp .env.example .env
```

Default configuration:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_VERSION=v1
```

### 4. Build Backend

The backend needs to be compiled from TypeScript:

```bash
cd domain-variant-service
npm run build
```

This creates the `dist/` directory with compiled JavaScript.

## Running the Application

### Development Mode

#### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd domain-variant-service
npm run dev
```

The backend will start on http://localhost:3001 with hot-reload enabled.

**Terminal 2 - Frontend:**
```bash
cd domain-monitor-frontend
npm run dev
```

The frontend will start on http://localhost:5173

#### Option 2: Run from Root

```bash
# Run backend in one terminal
npm run dev --workspace=domain-variant-service

# Run frontend in another terminal
npm run dev --workspace=domain-monitor-frontend
```

### Production Mode

**Build both services:**
```bash
npm run build
```

**Start backend:**
```bash
cd domain-variant-service
npm start
```

The backend will run on the port specified in `.env` (default: 3001).

**Serve frontend:**
```bash
cd domain-monitor-frontend
npm run preview
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm test --workspace=domain-variant-service
```

### Run Linting

```bash
npm run lint
```

## Project Structure

```
domain-monitor/
├── domain-monitor-frontend/     # React frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── .env                    # Frontend environment variables
│   └── package.json
│
├── domain-variant-service/      # Express.js backend service
│   ├── src/
│   │   ├── server.ts           # Main server file
│   │   ├── variantGenerator.ts # Core algorithm
│   │   ├── config.ts           # Configuration management
│   │   ├── logger.ts           # Winston logger
│   │   └── validators.ts       # Input validation
│   ├── test/                   # Unit tests
│   ├── .env                    # Backend environment variables
│   └── package.json
│
└── package.json                # Root workspace config
```

## API Endpoints

### Health Check
```
GET /health
```

### Generate Domain Variants
```
POST /api/v1/domains/variants/generate
Body: { "domain": "example.com" }
```

### Create Scan
```
POST /api/v1/scans
Body: { "variants": ["example.com", "examp1e.com"] }
```

### Get Scan Results
```
GET /api/v1/scans/:id/results
```

### Generate Report
```
POST /api/v1/reports
Body: { "scanId": "scan_xxx" }
```

### Download Report
```
GET /api/v1/reports/:id/download
```

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

1. Change the port in `.env` files
2. Update both backend and frontend `.env` files to match

### CORS Errors

Ensure `CORS_ORIGIN` in backend `.env` matches the frontend URL:
```env
CORS_ORIGIN=http://localhost:5173
```

### Build Errors

Clear the build cache and reinstall:
```bash
npm run clean --workspace=domain-variant-service
rm -rf node_modules
npm install
```

### TypeScript Errors

Ensure you're using compatible TypeScript versions:
```bash
npm list typescript
```

## Next Steps

1. Review the [Architecture Documentation](docs/architecture/)
2. Check the [API Documentation](docs/architecture/domain-monitor-api-design.md)
3. Explore the [Implementation Roadmap](docs/architecture/domain-monitor-implementation-roadmap.md)

## Support

For issues or questions, please refer to the project README.md or create an issue in the repository.
