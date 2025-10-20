import React from 'react';
import { Paper, Typography } from '@mui/material';

const AlertsPanel: React.FC = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      Alerts Panel
    </Typography>
    <Typography>
      View and manage security alerts here. (UI coming soon)
    </Typography>
  </Paper>
);

export default AlertsPanel;