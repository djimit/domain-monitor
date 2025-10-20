import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Alert, CircularProgress } from '@mui/material';

interface ScanOrchestrationProps {
  variants: string[];
  onScanStarted: (scanId: string) => void;
}

const API_URL = '/api/v1/scans';

const ScanOrchestration: React.FC<ScanOrchestrationProps> = ({ variants, onScanStarted }) => {
  const [scanStarted, setScanStarted] = React.useState(false);
  const [scanId, setScanId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'Unknown error');
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
        <Alert severity="info">No variants selected. Please generate and select variants first.</Alert>
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
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {scanId && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Scan started! Scan ID: {scanId}
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
};

export default ScanOrchestration;