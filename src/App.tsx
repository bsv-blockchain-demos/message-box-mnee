import { useCallback, useState } from 'react'
import { Container, Stack, Button } from '@mui/material'
import IdentitySelector from './IdentitySelector'
import { Identity } from '@bsv/identity-react'
import Header from './Header'
import AmountSelector from './AmountSelector'

function App() {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null)
  const [amount, setAmount] = useState<number>(0)

  const pay = useCallback(() => {
    console.log('Pay', selectedIdentity?.identityKey, amount)
  }, [selectedIdentity, amount])

  return (
      <Container>
        <Stack spacing={3} alignItems="center">
          <Header />
          <IdentitySelector selectedIdentity={selectedIdentity} setSelectedIdentity={setSelectedIdentity} />
          <AmountSelector amount={amount} setAmount={setAmount} />
          <Button onClick={pay}>Pay</Button>
        </Stack>
      </Container>
  )
}

export default App
