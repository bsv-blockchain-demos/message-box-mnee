import { useState } from 'react'
import { Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import AmountSelector from '../components/AmountSelector'
import { cosignBroadcast, createTx } from '../mnee/helpers'
import { getMNEEAddress } from '../mnee/getAddress'
import { Transaction } from '@bsv/sdk'

function P2Address() {
  const [loading, setLoading] = useState<boolean>(false)
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const { wallet, mnee, tokens, getBalance, config } = useWallet()

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
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

      const { instructions, change } = await getMNEEAddress(wallet)
      if (!instructions || !change) {
        toast.error('Failed to get change address')
        return
      }

      const createTxRes = await createTx(wallet, mnee, tokens, address, Math.floor(amount * 100000), change, config)
      if (createTxRes.error) {
        const e = createTxRes.error || 'Failed to create transaction'
        console.error(e)
        toast.error(e)
        return
      }
      const response: { tx: Transaction, error: string | false} = await cosignBroadcast(createTxRes.tx, mnee)
      if (response?.tx) {
        
        const valid = await mnee.validateMneeTx(response.tx.toHex())
        if (!valid) {
          toast.error('Invalid transaction was retrieved, did not pass SPV')
          return
        }

        const internalizeResponse = await wallet.internalizeAction({
          tx: response.tx.toAtomicBEEF(),
          outputs: [{
            outputIndex: 1,
            protocol: 'basket insertion',
            insertionRemittance: {
              basket: 'MNEE tokens',
              customInstructions: JSON.stringify(instructions),
              tags: ['MNEE', 'change']
            }
          }],
          description: 'Paying MNEE to recipient address'
        })
        if (!internalizeResponse.accepted) {
          toast.error('Wallet rejected the change output')
        } else {
          toast.success(`Payment sent! TXID: ${response.tx.id('hex')}`)
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
