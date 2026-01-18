import { createTheme } from '@mui/material/styles';

/**
 * Centralized theme configuration for the extension
 * Dark theme with green (plant-like) color palette
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4a7c59', // Forest green
      light: '#6b9d7a', // Lighter forest green
      dark: '#2d4a35', // Darker forest green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#87a96b', // Sage green
      light: '#a8c48a', // Light sage
      dark: '#6b8554', // Dark sage
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1f1c', // Very dark green-tinted background
      paper: '#252b28', // Slightly lighter for cards/panels
    },
    text: {
      primary: '#e8ede9', // Light green-tinted white
      secondary: '#b8c5ba', // Muted green-gray
    },
    error: {
      main: '#d32f2f', // Keep red for errors/over-limit
      light: '#ef5350',
      dark: '#c62828',
    },
    success: {
      main: '#66bb6a', // Bright green for success states
      light: '#81c784',
      dark: '#4caf50',
    },
    warning: {
      main: '#ffa726', // Amber for warnings
    },
    info: {
      main: '#42a5f5', // Blue for info
    },
    divider: '#3a403d', // Dark green-gray for dividers
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#e8ede9',
    },
    h2: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#e8ede9',
    },
    h3: {
      fontSize: '18px',
      fontWeight: 500,
      color: '#e8ede9',
    },
    body1: {
      fontSize: '14px',
      color: '#e8ede9',
    },
    body2: {
      fontSize: '12px',
      color: '#b8c5ba',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#252b28',
          border: '1px solid #3a403d',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1a1f1c',
            '& fieldset': {
              borderColor: '#3a403d',
            },
            '&:hover fieldset': {
              borderColor: '#4a7c59',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4a7c59',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b8c5ba',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#4a7c59',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '6px',
        },
        containedPrimary: {
          backgroundColor: '#4a7c59',
          '&:hover': {
            backgroundColor: '#6b9d7a',
          },
        },
        containedSecondary: {
          backgroundColor: '#87a96b',
          '&:hover': {
            backgroundColor: '#a8c48a',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d4a35',
          borderRadius: '4px',
        },
        bar: {
          borderRadius: '4px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#252b28',
          color: '#e8ede9',
        },
      },
    },
  },
});
