import { Stack, Box, Typography } from '@mui/material'
import ThemedMneeLogo from './ThemedMneeLogo'
import Balance from './Balance'

function Header() {
  return (
    <Stack alignItems="center">
      <Box pt={3}>
        <ThemedMneeLogo />
      </Box>
      <Box pb={3}>
        <Typography variant="caption" color="primary">Send MNEE payments to certified identities</Typography>
      </Box>
      <Balance />
    </Stack>
  )
}

export default Header
