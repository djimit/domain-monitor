import React, { useState } from 'react';
import { Paper, Typography, TextField, Button, List, ListItem, ListItemButton, Checkbox, ListItemText, CircularProgress, Alert } from '@mui/material';

interface VariantGeneratorProps {
  onVariantsSelected: (variants: string[]) => void;
}

// Use environment variable for API URL - throw error if not set in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production'
  ? (() => { throw new Error('VITE_API_BASE_URL must be set in production'); })()
  : 'http://localhost:3001');
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${API_BASE_URL}/api/${API_VERSION}/domains/variants/generate`;

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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input })
      });
      if (!res.ok) {
        throw new Error(`Failed to generate variants: ${res.status}`);
      }
      const data = await res.json();
      setVariants(data.data.variants || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate variants. Please try again.');
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