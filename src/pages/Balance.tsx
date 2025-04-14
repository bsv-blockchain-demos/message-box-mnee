import { Stack, Divider, Typography } from "@mui/material"
import { useWallet } from "../context/WalletContext"
import { useCallback, useEffect, useState } from "react"
import { Beef, WalletOutput } from "@bsv/sdk"
import { parseInscription } from "./FundMetanet"
const prodTokenId = 'ae59f3b898ec61acbdb6cc7a245fabeded0c094bf046f35206a3aec60ef88127_0';

export default function Balance() {
    const {wallet, setTokens, balance, setBalance, tokens } = useWallet()

    const getBalance = useCallback(async () => {
      await wallet.isAuthenticated()
      const ts = await wallet.listOutputs({
          basket: 'MNEE tokens',
          include: 'entire transactions',
          includeCustomInstructions: true
      })
      console.log({ ts })
      const spendable = { ...ts }
      const spendableTokens = spendable.outputs.filter(token => token.spendable)
      spendable.outputs = spendableTokens
      setTokens(spendable)
      let total = 0
      spendable.outputs.map(token => {
        // get the tx from the beef
        const [txid, vout] = token.outpoint.split('.')
        const beef = Beef.fromBinary(ts.BEEF as number[])
        const tx = beef.findAtomicTransaction(txid)
        console.log({ tx })
        if (!tx) return
        const output = tx.outputs[parseInt(vout)]
        console.log({ output })
        if (!output) return
        const script = output.lockingScript
        console.log({ script })
        const inscription = parseInscription(script)
        console.log({ inscription })
        if (prodTokenId !== inscription.id) return
        if (inscription.op !== 'transfer') return
        total += parseInt(inscription.amt)
      })
      setBalance(total)
  }, [wallet])

  useEffect(() => {
      getBalance()
  }, [])

    return (
      <Stack>
        <Typography variant="h5">MNEE Balance</Typography>
        <Typography variant="h5">${balance / 100000}</Typography>
        <Divider />
        <Typography variant="h5">Tokens</Typography>
        {tokens?.outputs?.map((token: WalletOutput) => (
          <Stack key={token.outpoint} direction="row" spacing={2}>
            <Typography key={token.outpoint} variant="subtitle1">{token.outpoint}</Typography>
            <Typography key={token.outpoint + 'amount'} variant="subtitle1">{token.spendable ? 'Spendable' : 'Spent'}</Typography>
          </Stack>
        ))}
      </Stack>
    )
  }