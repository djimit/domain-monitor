import React, { useEffect, useState } from 'react';
import { Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';

interface ResultsDashboardProps {
  scanId: string | null;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ scanId }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    setResults([]);
    fetch(`/api/v1/scans/${scanId}/results`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch scan results');
        return res.json();
      })
      .then(data => {
        setResults(data.data.results || []);
      })
      .catch(err => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false));
  }, [scanId]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Results Dashboard
      </Typography>
      {!scanId ? (
        <Alert severity="info">No scan started yet. Please start a scan to view results.</Alert>
      ) : loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : results.length === 0 ? (
        <Alert severity="info">No results found for this scan.</Alert>
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
                  secondary={result.status || result.risk || JSON.stringify(result)}
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