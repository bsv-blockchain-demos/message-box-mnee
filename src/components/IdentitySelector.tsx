import { Stack, Typography, IconButton, Link } from '@mui/material'
import { IdentityCard, Identity } from '@bsv/identity-react'
import { useTheme } from '@mui/material/styles'
import { Clear, Label as LabelIcon } from '@mui/icons-material'
import CustomIdentitySearchField from './CustomIdentitySearchField'

interface IdentitySelectorProps {
  readonly selectedIdentity: Identity | null;
  readonly setSelectedIdentity: (identity: Identity | null) => void;
}

function IdentitySelector({ selectedIdentity, setSelectedIdentity }: IdentitySelectorProps) {
  const theme = useTheme()

  // Using type assertion to work around the Material UI version mismatch
  const compatTheme = theme as any

  if (!selectedIdentity) {
    return (
      <Stack direction="column" alignItems="center" justifyContent="space-between">
        <CustomIdentitySearchField theme={compatTheme} onIdentitySelected={setSelectedIdentity} />
        <Typography variant="body1" color="text.primary">Works with email, X handle, etc.</Typography>
        <Typography variant="caption" color="text.secondary">
          Make yourself discoverable with <Link href="https://socialcert.net" target="_blank" rel="noopener noreferrer" color="primary">SocialCert</Link>
        </Typography>
      </Stack>
    )
  }
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <IdentityCard identityKey={selectedIdentity.identityKey} themeMode={compatTheme.palette.mode} />
      <IconButton onClick={() => setSelectedIdentity(null)} size="small">
        <Clear />
      </IconButton>
    </Stack>
  )
}

export default IdentitySelector