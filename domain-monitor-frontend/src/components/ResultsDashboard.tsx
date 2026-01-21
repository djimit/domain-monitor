import { useEffect, useState } from 'react';
import { Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';

interface ScanResult {
  domain: string;
  variant?: string;
  dnsResolved: boolean;
  httpStatus: number | null;
  error: string | null;
  status: 'scanned' | 'unreachable';
  scannedAt?: string;
  risk?: string;
}

interface ResultsDashboardProps {
  scanId: string | null;
}

// Use environment variable for API URL - throw error if not set in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production'
  ? (() => { throw new Error('VITE_API_BASE_URL must be set in production'); })()
  : 'http://localhost:3001');
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ scanId }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    setResults([]);
    fetch(`${API_BASE_URL}/api/${API_VERSION}/scans/${encodeURIComponent(scanId)}/results`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch scan results');
        return res.json();
      })
      .then(data => {
        setResults(data.data.results || []);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [scanId]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Results Dashboard
      </Typography>
      {!scanId ? (
        <Alert severity="info"><span>No scan started yet. Please start a scan to view results.</span></Alert>
      ) : loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error"><span>{error}</span></Alert>
      ) : results.length === 0 ? (
        <Alert severity="info"><span>No results found for this scan.</span></Alert>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Scan Results:
          </Typography>
          <List dense>
            {results.map((result, idx) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={result.domain || result.variant || 'Unknown'}
                  secondary={`Status: ${result.status}${result.dnsResolved ? ' | DNS: Resolved' : ' | DNS: Not resolved'}${result.httpStatus ? ` | HTTP: ${result.httpStatus}` : ''}${result.error ? ` | Error: ${result.error}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default ResultsDashboard;