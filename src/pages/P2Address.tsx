import { useState } from 'react'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import AmountSelector from '../components/AmountSelector'
import { cosignBroadcast, createTx, fetchBeef } from '../mnee/helpers'
import { MNEETokenInstructions } from '../mnee/TokenTransfer'
import { GetPublicKeyArgs, OutpointString, PublicKey } from '@bsv/sdk'

function P2Address() {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const { wallet, tokens } = useWallet()

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
  }

  const getChangeAddress = async () : Promise<{ instructions: MNEETokenInstructions, change: string }> => {
    try {
        console.log('creating change address')
        const instructions = {
            protocolID: [2, 'Pay MNEE'],
            keyID: 'change',
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

      const createTxRes = await createTx(wallet, tokens, address, Math.floor(amount * 100000), change)
      if (createTxRes.error) {
        const e = createTxRes.error || 'Failed to create transaction'
        console.error(e)
        toast.error(e)
        return
      }
      const response = await cosignBroadcast(createTxRes.tx)
      if (response?.tx) {
        toast.success(`Payment sent! TXID: ${response.tx.id('hex')}`)
        // for each input, we'd need to grab the sourceTransaction
        const atomicBEEF = await fetchBeef(response.tx.id('hex'))
        const spent = createTxRes.tx.inputs.map(input => (input.sourceTXID + '.' + input.sourceOutputIndex) as OutpointString)
        await Promise.all(spent.map(async output => {
          const { relinquished } = await wallet.relinquishOutput({
            basket: 'MNEE tokens',
            output
          })
          if (!relinquished) {
            toast.error('Failed to relinquish output')
            return
          }
        }))
        const { accepted } = await wallet.internalizeAction({
          tx: atomicBEEF,
          description: 'Receive MNEE tokens',
          labels: ['MNEE'],
          outputs: [{
            outputIndex: 1,
            protocol: 'basket insertion',
            insertionRemittance: {
                basket: 'MNEE tokens',
                customInstructions: JSON.stringify(instructions),
                tags: ['MNEE']
            }
        }]
        })
        if (!accepted) {
          toast.error('Metanet Desktop rejected the change output')
        } else {
          toast.success(`Funds received: ${amount} MNEE`)
          setAddress('')
          setAmount(0)
        }
      } else {
        toast.error('MNEE broadcast failed')
      }
    } catch (error) {
      toast.error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Stack spacing={2} width="100%" maxWidth="320px" alignItems="center" justifyContent="center">
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
        disabled={amount <= 0 || !address}
      >
        Send
      </Button>
    </Stack>
  )
}

export default P2Address
