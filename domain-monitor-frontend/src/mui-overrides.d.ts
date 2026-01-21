import '@mui/material/Alert';

declare module '@mui/material/Alert' {
  interface AlertProps {
    children?: React.ReactNode;
  }
}
