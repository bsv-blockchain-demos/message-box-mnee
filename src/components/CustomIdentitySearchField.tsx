import React from 'react'
import { IdentitySearchField, Identity } from '@bsv/identity-react'
import { useTheme } from '@mui/material/styles'
import { Theme } from '@mui/material'

interface CustomIdentitySearchFieldProps {
  onIdentitySelected: (identity: Identity) => void;
  theme?: Theme; // Optional if you want to allow passing a custom theme
}

const CustomIdentitySearchField: React.FC<CustomIdentitySearchFieldProps> = ({ 
  onIdentitySelected,
  theme: propTheme 
}) => {
  const defaultTheme = useTheme()
  
  // Use provided theme or default theme
  const theme = propTheme || defaultTheme
  
  // Create a modified version of the theme with our custom properties
  const modifiedTheme = {
    ...theme,
    // Add a custom property that will be used in our global CSS
    customSearchIconColor: theme.palette.primary.main,
    // Safely build components object with proper type handling
    components: {
      ...(theme.components || {}),
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            // This adds a class for our CSS to target
            '&.search-icon': {
              color: theme.palette.primary.main
            }
          }
        }
      }
    }
  }

  return (
    <IdentitySearchField 
      theme={modifiedTheme as any} 
      onIdentitySelected={onIdentitySelected}
    />
  )
}

export default CustomIdentitySearchField
