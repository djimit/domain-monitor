import React, { useState } from 'react';
import { CssBaseline, Container, AppBar, Toolbar, Typography, Box, Tabs, Tab } from '@mui/material';
import DomainVariantGenerator from './components/DomainVariantGenerator';
import ScanOrchestration from './components/ScanOrchestration';
import ResultsDashboard from './components/ResultsDashboard';
import AlertsPanel from './components/AlertsPanel';
import ReportsPanel from './components/ReportsPanel';

function a11yProps(index: number) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`,
  };
}

const App: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [scanId, setScanId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleVariantsSelected = (variants: string[]) => {
    setSelectedVariants(variants);
    setTab(1); // Switch to Scan tab
  };

  const handleScanStarted = (id: string) => {
    setScanId(id);
    setTab(2); // Switch to Results tab
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Domain-Monitor
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={handleTabChange} aria-label="main navigation tabs">
            <Tab label="Variants" {...a11yProps(0)} />
            <Tab label="Scan" {...a11yProps(1)} />
            <Tab label="Results" {...a11yProps(2)} />
            <Tab label="Alerts" {...a11yProps(3)} />
            <Tab label="Reports" {...a11yProps(4)} />
          </Tabs>
        </Box>
        <Box sx={{ mt: 2 }}>
          {tab === 0 && <DomainVariantGenerator onVariantsSelected={handleVariantsSelected} />}
          {tab === 1 && <ScanOrchestration variants={selectedVariants} onScanStarted={handleScanStarted} />}
          {tab === 2 && <ResultsDashboard scanId={scanId} />}
          {tab === 3 && <AlertsPanel />}
          {tab === 4 && <ReportsPanel scanId={scanId} />}
        </Box>
      </Container>
    </>
  );
};

export default App;
