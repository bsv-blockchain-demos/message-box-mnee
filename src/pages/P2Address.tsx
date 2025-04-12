import { useState } from 'react'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import AmountSelector from '../components/AmountSelector'

function P2Address() {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const { wallet } = useWallet()

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
  }

  const handlePayment = async () => {
    if (!address) {
      toast.error('Please enter a valid address')
      return
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await wallet.isAuthenticated()
      const tx = await wallet.pay({ to: address, amount })
      toast.success(`Payment sent! TXID: ${tx.txid}`)
      setAddress('')
      setAmount(0)
    } catch (error) {
      toast.error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Stack spacing={2} width="100%" maxWidth="320px">
      <Typography variant="h5">Pay to Address</Typography>
      <TextField
        fullWidth
        label="Bitcoin Address"
        variant="filled"
        value={address}
        onChange={handleAddressChange}
        placeholder="Enter Bitcoin address"
      />
      <AmountSelector setAmount={setAmount} />
      <Button 
        onClick={handlePayment} 
        variant="contained" 
        color="primary" 
        disabled={amount <= 0 || !address}
      >
        Pay
      </Button>
    </Stack>
  )
}

export default P2Address
