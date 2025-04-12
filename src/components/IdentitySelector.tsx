import { Stack, Typography, IconButton } from '@mui/material'
import { IdentitySearchField, IdentityCard, Identity } from '@bsv/identity-react'
import { useTheme } from '@mui/material/styles'
import { Clear } from '@mui/icons-material'

interface IdentitySelectorProps {
  readonly selectedIdentity: Identity | null;
  readonly setSelectedIdentity: (identity: Identity | null) => void;
}

function IdentitySelector({ selectedIdentity, setSelectedIdentity }: IdentitySelectorProps) {
  const theme = useTheme()

  // Using type assertion to work around the Material UI version mismatch
  const compatTheme = theme as any

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
      <Typography variant="h5">Pay</Typography>
      {selectedIdentity
        ? <>
          <IdentityCard identityKey={selectedIdentity.identityKey} themeMode={compatTheme.palette.mode} />
          <IconButton onClick={() => setSelectedIdentity(null)} size="small">
            <Clear />
          </IconButton>
        </>
        : <IdentitySearchField theme={compatTheme} onIdentitySelected={setSelectedIdentity} />
      }
    </Stack>
  )
}

export default IdentitySelector