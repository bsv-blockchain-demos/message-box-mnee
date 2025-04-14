import { Stack, Tooltip, Typography } from "@mui/material"
import { useWallet, formatToUSD } from "../context/WalletContext"

const Balance = () => {
  const { balance } = useWallet()
  
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Tooltip title="MNEE Balance">
        <Typography variant="h3" color="primary" sx={{ fontSize: 36, fontWeight: 'bold' }}>
          {formatToUSD(balance)}
        </Typography>
      </Tooltip>
    </Stack>
  )
}

export default Balance
