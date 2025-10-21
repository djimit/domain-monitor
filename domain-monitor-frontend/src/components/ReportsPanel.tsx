import React, { useState } from 'react';
import { Paper, Typography, Button, Alert, CircularProgress, Link } from '@mui/material';

interface ReportsPanelProps {
  scanId?: string | null;
}

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

const ReportsPanel: React.FC<ReportsPanelProps> = ({ scanId }) => {
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!scanId) {
      setError('No scan available for report generation.');
      return;
    }
    setLoading(true);
    setError(null);
    setReportId(null);
    setDownloadUrl(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${API_VERSION}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId })
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      const id = data.data.reportId || data.data.id;
      setReportId(id);
      // Fetch download URL
      const downloadRes = await fetch(`${API_BASE_URL}/api/${API_VERSION}/reports/${id}/download`);
      if (!downloadRes.ok) throw new Error('Failed to fetch report download link');
      const blob = await downloadRes.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reports Panel
      </Typography>
      {!scanId ? (
        <Alert severity="info">No scan available. Please run a scan to generate a report.</Alert>
      ) : (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReport}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Generate HTML Report'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {downloadUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Report ready!{' '}
              <Link href={downloadUrl} target="_blank" rel="noopener">
                Download HTML Report
              </Link>
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
};

export default ReportsPanel;