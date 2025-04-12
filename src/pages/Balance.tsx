import { Stack, Divider, Typography } from "@mui/material"
import { useWallet } from "../context/WalletContext"
import { useCallback, useEffect } from "react"
import { Script, Utils } from "@bsv/sdk"
import { parseInscription } from "./FundMetanet"
const prodTokenId = 'ae59f3b898ec61acbdb6cc7a245fabeded0c094bf046f35206a3aec60ef88127_0';

export default function Balance() {
    const {wallet, mnee, tokens, setTokens, balance, setBalance } = useWallet()

    const getBalance = useCallback(async () => {
      await wallet.isAuthenticated()
      const ts = await wallet.listOutputs({
          basket: 'MNEE tokens',
          include: 'locking scripts'
      })
      setTokens(ts)
      let total = 0
      ts.outputs.map(token => {
        const script = Script.fromHex(token.lockingScript || '')
        const insc = parseInscription(script)
        const content = insc?.file?.content
        if (!content) return
        const inscriptionData = Utils.toUTF8(content)
        if (!inscriptionData) return
        const inscriptionJson = JSON.parse(inscriptionData)
        if (prodTokenId !== inscriptionJson.id) return
        if (inscriptionJson.op !== 'transfer') return
        total += parseInt(inscriptionJson.amt)
      })
      setBalance(total)
  }, [wallet, mnee])

  useEffect(() => {
      getBalance()
  }, [])

    return (
      <Stack>
        <Typography variant="h5">MNEE Balance</Typography>
        <Typography variant="h5">${mnee.fromAtomicAmount(balance)}</Typography>
        <Divider />
        <Typography variant="h5">Spendable Tokens</Typography>
        {tokens?.outputs?.map(token => (<>
          <Typography key={token.outpoint} variant="subtitle1">{token.outpoint}</Typography>
          <Typography key={token.outpoint + 'amount'} variant="subtitle1">{token.customInstructions}</Typography>
        </>))}
      </Stack>
    )
  }