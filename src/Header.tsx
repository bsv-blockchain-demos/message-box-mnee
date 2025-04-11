import { Stack, Box, Typography } from '@mui/material'

function Header() {
  return (
      <Stack alignItems="center">
        <Box pt={3}>
          <Typography variant="h2">P2MNEE</Typography>
        </Box>
        <Box pb={3}>
          <Typography variant="h5">With KYC</Typography>
        </Box>
      </Stack>
  )
}

export default Header
