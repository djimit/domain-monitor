import React, { useState } from 'react';
import { Paper, Typography, TextField, Button, List, ListItem, ListItemButton, Checkbox, ListItemText, CircularProgress, Alert } from '@mui/material';

interface VariantGeneratorProps {
  onVariantsSelected: (variants: string[]) => void;
}

// Try direct URL instead of proxy
const API_URL = 'http://localhost:3001/api/v1/domains/variants/generate';

const DomainVariantGenerator: React.FC<VariantGeneratorProps> = ({ onVariantsSelected }) => {
  const [input, setInput] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setVariants([]);
    setSelected([]);
    try {
      console.log('Sending request to', API_URL, 'with domain:', input);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', res.status, errorText);
        throw new Error(`Failed to generate variants: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('Received response:', data);
      setVariants(data.data.variants || []);
    } catch (err: any) {
      console.error('Error in handleGenerate:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (variant: string) => {
    setSelected(prev =>
      prev.includes(variant)
        ? prev.filter(v => v !== variant)
        : [...prev, variant]
    );
  };

  const handleSelectAll = () => {
    setSelected(variants);
  };

  const handleDeselectAll = () => {
    setSelected([]);
  };

  const handleProceed = () => {
    onVariantsSelected(selected);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Domain Variant Generator
      </Typography>
      <TextField
        label="Domain or Company Name"
        value={input}
        onChange={e => setInput(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleGenerate} disabled={loading || !input}>
        Generate Variants
      </Button>
      {loading && <CircularProgress sx={{ ml: 2 }} size={24} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {variants.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            Select variants to scan:
          </Typography>
          <Button onClick={handleSelectAll} size="small" sx={{ mr: 1 }}>Select All</Button>
          <Button onClick={handleDeselectAll} size="small">Deselect All</Button>
          <List dense>
            {variants.map(variant => (
              <ListItem key={variant} disablePadding>
                <ListItemButton onClick={() => handleToggle(variant)}>
                  <Checkbox checked={selected.includes(variant)} />
                  <ListItemText primary={variant} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={selected.length === 0}
            onClick={handleProceed}
          >
            Proceed to Scan
          </Button>
        </>
      )}
    </Paper>
  );
};

export default DomainVariantGenerator;