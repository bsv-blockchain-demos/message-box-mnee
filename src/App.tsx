import { useCallback, useEffect, useState } from 'react'
import { Container, Stack, Button, Typography } from '@mui/material'
import IdentitySelector from './components/IdentitySelector'
import { Identity } from '@bsv/identity-react'
import Header from './components/Header'
import AmountSelector from './components/AmountSelector'
import { toast } from 'react-toastify'
import FundMetanet from './components/FundMetanet'
import { useWallet } from './context/WalletContext'

function App() {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const { wallet, balance } = useWallet()

  const pay = useCallback(async () => {
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    console.log('Pay', selectedIdentity?.identityKey, amount)
    // first we have to get the current user's MNEE tokens by checking their basket
    await wallet.waitForAuthentication()
    const tokens = await wallet.listOutputs({
      basket: 'MNEE tokens'
    })
    console.log('Tokens', tokens)
  }, [selectedIdentity, amount])

  return (
    <Container>
      <Stack spacing={3} alignItems="center">
        <Header />
        {balance === 0
          ? <FundMetanet />
          : <>
            <IdentitySelector selectedIdentity={selectedIdentity} setSelectedIdentity={setSelectedIdentity} />
            <AmountSelector setAmount={setAmount} />
            <Button onClick={pay} variant="contained" color="primary" disabled={amount === 0 || !selectedIdentity}>Pay</Button>
            <Stack>
              <Typography variant="h5">MNEE Balance</Typography>
              <Typography variant="h5">{balance}</Typography>
            </Stack>
          </>}
      </Stack>
    </Container>
  )
}

export default App
