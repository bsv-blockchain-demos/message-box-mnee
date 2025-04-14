import { Stack, Typography, IconButton, Tooltip } from "@mui/material"
import { Link } from "@mui/icons-material"
import { useWallet } from "../context/WalletContext"
import { useEffect } from "react"

export default function Tokens
() {
    const { getBalance, displayTokens } = useWallet()

    useEffect(() => {
        getBalance()
    }, [getBalance])

    return (
      <Stack width="100%" maxWidth={640} sx={{ pb: 5 }}>
        <Typography textAlign='center' variant="caption" color="text.secondary">Your available MNEE tokens.</Typography>
        <Stack direction="column" width="100%" sx={{ mb: 5 }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%', py: 1, fontWeight: 'bold', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle1" sx={{ flex: 2 }}>MNEE</Typography>
            <Typography variant="subtitle1" sx={{ flex: 9 }}>txid</Typography>
            <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'right' }}>vout</Typography>
            <Typography variant="subtitle1" sx={{ width: 48 }}></Typography>
          </Stack>
          {displayTokens?.map((token: any) => (
              <Stack key={token.outpoint} direction="row" spacing={2} alignItems="center" sx={{ width: '100%', py: 1 }}>
                <Typography variant="subtitle1" sx={{ flex: 2 }}>{token.amt}</Typography>
                <Typography variant="body2" sx={{ flex: 9, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {token.txid}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary', textAlign: 'right' }}>
                  {token.vout}
                </Typography>
                <Tooltip title="View on WhatsOnChain">
                  <IconButton size="small" onClick={() => window.open(`https://whatsonchain.com/tx/${token.txid}?tab=m8eqcrbs`, '_blank')}>
                    <Link fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
          ))}
        </Stack>
      </Stack>
    )
  }