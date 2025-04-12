import { createTheme } from '@mui/material/styles'

// Define a custom theme with a dark background

// Define custom spacing function compatible with Spacing type
const customSpacing = (factor: number): string => `${8 * factor}px`

// Create custom theme using createTheme
const Theme = createTheme({
  palette: {
    mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    primary: {
      main: '#1e81b0',
    },
    secondary: {
      main: '#e28743',
    },
    background: {
      default: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#121212' : '#f5f5f5',
      paper: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#242424' : '#ffffff',
    },
    text: {
      primary: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#333333',
      secondary: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#b0b0b0' : '#666666',
    },
    error: {
      main: '#ff3860',
    },
    success: {
      main: '#48c774',
    },
    warning: {
      main: '#ffdd57',
    },
    info: {
      main: '#3273dc',
    },
  },
  typography: {
    fontFamily: 'Helvetica, Arial, Roboto, sans-serif',
    h4: {
      fontWeight: 700
    },
    button: {
      textTransform: 'none'
    }
  },
  // Override default MUI spacing with custom spacing function
  spacing: customSpacing
})

export default Theme // Export custom theme
