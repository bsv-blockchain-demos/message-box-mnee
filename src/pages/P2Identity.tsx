import AmountSelector from '../components/AmountSelector'
import { useState, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import IdentitySelector from '../components/IdentitySelector'
import { Button, Typography, Stack, CircularProgress } from '@mui/material'
import { IdentityProps } from '@bsv/identity-react'

export default function P2Identity () {
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState<number>(0)
    const { wallet, tokens, balance, getBalance, mneePeerPayClient } = useWallet()
    const [selectedIdentity, setSelectedIdentity] = useState<IdentityProps | null>(null)

    const getInboundPayments = useCallback(async () => {
      try {
        setLoading(true)
        const payments = await mneePeerPayClient.listIncomingPayments()
        if (payments.length === 0) {
          toast.info('No inbound payments found')
          return
        }
        await Promise.all(payments.map(async payment => {
          await mneePeerPayClient.acceptPayment(payment)
        }))
        getBalance()
      } catch (error) {
        toast.error('Failed to list payments')
        console.error({ error })
      } finally {
        setLoading(false)
      }
    }, [mneePeerPayClient])

    const pay = useCallback(async () => {
      try {
        setLoading(true)
        if (amount <= 0) {
          toast.error('Amount must be greater than 0')
          return
        }

        const units = amount * 100000
        if (balance < units + 1000) {
          toast.error('Insufficient balance')
          return
        }
        console.log('Pay', selectedIdentity?.identityKey, amount) 
        const paid = await mneePeerPayClient.sendPayment(tokens, selectedIdentity?.identityKey!, units)
        if (paid.status === 'success') {
          console.log({ paid })
          toast.success('Payment sent successfully')
        } else {
          toast.error('Failed to send payment')
        }
        getBalance()
      } catch (error) {
        toast.error('Failed to send payment')
        console.error({ error })
      } finally {
        setLoading(false)
      }
    }, [selectedIdentity, amount, wallet, tokens, mneePeerPayClient])
    
    return (<Stack direction="column" alignItems="center" justifyContent="space-between" spacing={3} sx={{ pb: 5 }}>
      <Typography textAlign='center' variant="caption" color="text.secondary">Send MNEE to a certified identity.</Typography>
      {loading && <CircularProgress />}
      <Button onClick={getInboundPayments} variant="contained" color="primary" disabled={loading}>Check Inbound Payments</Button>
      <IdentitySelector selectedIdentity={selectedIdentity} setSelectedIdentity={setSelectedIdentity} />
      <AmountSelector setAmount={setAmount} />
      <Button onClick={pay} variant="contained" color="primary" disabled={amount === 0 || !selectedIdentity || loading}>Send</Button>
    </Stack>)
}