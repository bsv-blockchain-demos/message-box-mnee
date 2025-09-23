import { useState } from 'react'
import { Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import AmountSelector from '../components/AmountSelector'
import { cosignBroadcast, createTx } from '../mnee/helpers'
import { MNEETokenInstructions } from '../mnee/TokenTransfer'
import { GetPublicKeyArgs, PublicKey, SignActionSpend, Transaction } from '@bsv/sdk'

function P2Address() {
  const [loading, setLoading] = useState<boolean>(false)
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const { wallet, mnee, tokens, getBalance } = useWallet()

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
  }

  const getChangeAddress = async () : Promise<{ instructions: MNEETokenInstructions, change: string }> => {
    try {
        console.log('creating change address')
        const instructions = {
            protocolID: [2, 'Pay MNEE'],
            keyID: 'change' + new Date().toISOString().slice(0, 10),
            counterparty: 'self'
        } as GetPublicKeyArgs
        const { publicKey } = await wallet.getPublicKey(instructions)
        return { instructions: instructions as MNEETokenInstructions, change: PublicKey.fromString(publicKey).toAddress() }
    } catch (error) {
        console.error('Failed to get change address:', error)
        return { instructions: {} as MNEETokenInstructions, change: '' }
    }
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      if (!address) {
        toast.error('Please enter a valid address')
        return
      }

      if (amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }
      await wallet.isAuthenticated()

      const { instructions, change } = await getChangeAddress()
      if (!instructions || !change) {
        toast.error('Failed to get change address')
        return
      }

      const createTxRes = await createTx(wallet, mnee, tokens, address, Math.floor(amount * 100000), change, instructions)
      if (createTxRes.error) {
        const e = createTxRes.error || 'Failed to create transaction'
        console.error(e)
        toast.error(e)
        return
      }
      const response: { tx: Transaction, error: string | false} = await cosignBroadcast(createTxRes.tx, mnee)
      if (response?.tx) {
        const spends = response.tx.inputs!.reduce((acc, input, index) => ({
          ...acc,
          [index]: {
            unlockingScript: input.unlockingScript!.toHex()
          }
        }), {} as Record<string, SignActionSpend>)
        const signedResponse = await wallet.signAction({
          reference: createTxRes.reference,
          spends
        })
        toast.success(`Payment sent! TXID: ${response.tx.id('hex')}`)
        console.log({ signedResponse })
        if (!signedResponse.txid) {
          toast.error('Metanet Desktop rejected the change output')
        } else {
          toast.success(`Funds received: ${amount} MNEE`)
          setAddress('')
          setAmount(0)
        }
      } else {
        toast.error('MNEE broadcast failed')
      }
      getBalance()
    } catch (error) {
      toast.error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2} width="100%" maxWidth="320px" alignItems="center" justifyContent="center" sx={{ pb: 5 }}>
      <Typography textAlign='center' variant="caption" color="text.secondary">Send MNEE to an external wallet.</Typography>
      <TextField
        fullWidth
        label="Address"
        variant="filled"
        value={address}
        onChange={handleAddressChange}
        placeholder="1..."
      />
      <AmountSelector setAmount={setAmount} />
      <Button 
        onClick={handlePayment} 
        variant="contained" 
        color="primary" 
        disabled={amount <= 0 || !address || loading}
      >
        Send
      </Button>
      {loading && <CircularProgress />}
    </Stack>
  )
}

export default P2Address
