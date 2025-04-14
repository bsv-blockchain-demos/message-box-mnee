import { createTheme } from '@mui/material/styles'

// Define a custom theme with a dark background

// Define custom spacing function compatible with Spacing type
const customSpacing = (factor: number): string => `${8 * factor}px`

// Create custom theme using createTheme
const Theme = createTheme({
  palette: {
    mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    primary: {
      main: '#2F6134',
    },
    secondary: {
      main: '#ffeda5',
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
  spacing: customSpacing,
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#2F6134',
            },
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          '&:hover:not(.Mui-disabled)': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '.MuiFilledInput-underline:after': {
          borderBottomColor: '#2F6134 !important',
        },
        '.MuiFilledInput-underline.Mui-focused:after': {
          borderBottomColor: '#2F6134 !important',
        },
        // Directly target the specific CSS class identified
        '.css-1312ppl-MuiSvgIcon-root': {
          color: '#2F6134 !important',
        },
        // As a fallback also keep general targeting
        '.MuiInputAdornment-root .MuiSvgIcon-root[data-testid="SearchIcon"]': {
          color: '#2F6134 !important',
        },
        '.MuiInputBase-root .MuiInputAdornment-root svg': {
          color: '#2F6134 !important',
        },
        'body .MuiInputAdornment-root svg[data-testid="SearchIcon"], body .MuiInputAdornment-root svg:first-child': {
          color: '#2F6134 !important',
        },
        'svg[data-mui-test="SearchIcon"]': {
          color: '#2F6134 !important',
        },
        'svg[aria-label="search"]': {
          color: '#2F6134 !important',
        },
        '.search-icon, .searchIcon, .SearchIcon, [class*="SearchIcon"]': {
          color: '#2F6134 !important',
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:after': {
            borderBottomColor: '#2F6134',
          },
          '&.Mui-focused:after': {
            borderBottomColor: '#2F6134',
          },
        },
      },
    },
  },

})

export default Theme // Export custom theme
