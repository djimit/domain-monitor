import { useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Alert, CircularProgress } from '@mui/material';

interface ScanOrchestrationProps {
  variants: string[];
  onScanStarted: (scanId: string) => void;
}

// Use environment variable for API URL - throw error if not set in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production'
  ? (() => { throw new Error('VITE_API_BASE_URL must be set in production'); })()
  : 'http://localhost:3001');
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${API_BASE_URL}/api/${API_VERSION}/scans`;

const ScanOrchestration: React.FC<ScanOrchestrationProps> = ({ variants, onScanStarted }) => {
  const [scanStarted, setScanStarted] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants })
      });
      if (!res.ok) throw new Error('Failed to start scan');
      const data = await res.json();
      const id = data.data.scanId || data.data.id || '';
      setScanId(id);
      setScanStarted(true);
      if (id) onScanStarted(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Scan Orchestration
      </Typography>
      {variants.length === 0 ? (
        <Alert severity="info"><span>No variants selected. Please generate and select variants first.</span></Alert>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Variants to scan:
          </Typography>
          <List dense>
            {variants.map(variant => (
              <ListItem key={variant}>
                <ListItemText primary={variant} />
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleStartScan}
            disabled={scanStarted || loading}
          >
            {loading ? <CircularProgress size={20} /> : scanStarted ? 'Scan Started' : 'Start Scan'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}><span>{error}</span></Alert>}
          {scanId && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <span>Scan started! Scan ID: {scanId}</span>
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
};

export default ScanOrchestration;