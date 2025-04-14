import { createTheme } from '@mui/material/styles'

// Define a custom theme with a dark background

// Define custom spacing function compatible with Spacing type
const customSpacing = (factor: number): string => `${8 * factor}px`

const ourPrimary = '#2F6134'
const ourDarkPrimary = '#b0d9b4'

// Create custom theme using createTheme
const Theme = createTheme({
  palette: {
    mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    primary: {
      main: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary : ourPrimary,
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
    MuiLink: {
      styleOverrides: {
        root: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary : ourPrimary,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
      },
    },
  },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary : ourPrimary,
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
          borderBottomColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        '.MuiFilledInput-underline.Mui-focused:after': {
          borderBottomColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        // Directly target the specific CSS class identified
        '.css-1312ppl-MuiSvgIcon-root': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        // As a fallback also keep general targeting
        '.MuiInputAdornment-root .MuiSvgIcon-root[data-testid="SearchIcon"]': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        '.MuiInputBase-root .MuiInputAdornment-root svg': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        'body .MuiInputAdornment-root svg[data-testid="SearchIcon"], body .MuiInputAdornment-root svg:first-of-type': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        'svg[data-mui-test="SearchIcon"]': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        'svg[aria-label="search"]': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
        '.search-icon, .searchIcon, .SearchIcon, [class*="SearchIcon"]': {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:after': {
            borderBottomColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
          },
          '&.Mui-focused:after': {
            borderBottomColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? ourDarkPrimary + ' !important' : ourPrimary + ' !important',
          },
        },
      },
    },
  },
})

export default Theme // Export custom theme
