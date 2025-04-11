import { useCallback, useState } from 'react'
import { Container, Stack, Button } from '@mui/material'
import IdentitySelector from './IdentitySelector'
import { Identity } from '@bsv/identity-react'
import Header from './Header'
import AmountSelector from './AmountSelector'
import { toast } from 'react-toastify'

function App() {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const [amount, setAmount] = useState<number>(0)

  const pay = useCallback(() => {
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    console.log('Pay', selectedIdentity?.identityKey, amount)
  }, [selectedIdentity, amount])

  return (
      <Container>
        <Stack spacing={3} alignItems="center">
          <Header />
          <IdentitySelector selectedIdentity={selectedIdentity} setSelectedIdentity={setSelectedIdentity} />
          <AmountSelector setAmount={setAmount} />
          <Button onClick={pay} variant="contained" color="primary" disabled={amount === 0 || !selectedIdentity}>Pay</Button>
        </Stack>
      </Container>
  )
}

export default App
