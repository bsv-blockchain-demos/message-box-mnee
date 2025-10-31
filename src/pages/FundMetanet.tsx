import { Button, CircularProgress, Stack, Typography } from '@mui/material'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useState, useEffect } from 'react'
import { Utils, OP, Script, Hash } from '@bsv/sdk'
import { useWallet } from '../context/WalletContext'
import { toast } from 'react-toastify'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
// Define local types since the new SDK may have different type definitions
interface Inscription {
  file: { hash: string; size: number; type: string; content?: number[] };
  fields: Record<string, any>;
  op?: string;
  id?: string;
  amt?: string;
}

import { MNEETokenInstructions } from '../mnee/TokenTransfer'
import { getMNEEAddress } from '../mnee/getAddress'
import { fetchBeef } from '../mnee/helpers'

export const parseInscription = (script: Script) => {
    let fromPos: number | undefined;
    for (let i = 0; i < script.chunks.length; i++) {
      const chunk = script.chunks[i];
      if (
        i >= 2 &&
        chunk.data?.length === 3 &&
        Utils.toUTF8(chunk.data) == 'ord' &&
        script.chunks[i - 1].op == OP.OP_IF &&
        script.chunks[i - 2].op == OP.OP_FALSE
      ) {
        fromPos = i + 1;
      }
    }
    if (fromPos === undefined) return;
  
    const insc = {
      file: { hash: '', size: 0, type: '' },
      fields: {},
    } as Inscription;
  
    for (let i = fromPos; i < script.chunks.length; i += 2) {
      const field = script.chunks[i];
      if (field.op == OP.OP_ENDIF) {
        break;
      }
      if (field.op > OP.OP_16) return;
      const value = script.chunks[i + 1];
      if (value.op > OP.OP_PUSHDATA4) return;
  
      if (field.data?.length) continue;
  
      let fieldNo = 0;
      if (field.op > OP.OP_PUSHDATA4 && field.op <= OP.OP_16) {
        fieldNo = field.op - 80;
      } else if (field.data?.length) {
        fieldNo = field.data[0];
      }
      switch (fieldNo) {
        case 0:
          insc.file!.size = value.data?.length || 0;
          if (!value.data?.length) break;
          insc.file!.hash = Utils.toBase64(Hash.sha256(value.data));
          insc.file!.content = value.data;
          break;
        case 1:
          insc.file!.type = Utils.toUTF8(value.data || []);
          break;
      }
    }

    const inscriptionData = Utils.toUTF8(insc?.file?.content || [])
    return JSON.parse(inscriptionData)
  };

function FundMetanet() {
    const { wallet, mnee } = useWallet()
    const [loading, setLoading] = useState<boolean>(false)
    const [customInstructions, setCustomInstructions] = useState<MNEETokenInstructions | null>(null)
    const [address, setAddress] = useState<string>('')
    const [balance, setBalance] = useState<number>(0)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const parseUnitsFromRecentUtxos = async (recent: any) => {
        const tx = await fetchBeef(recent.txid)
        // const valid = await tx.verify()
        // if (!valid) toast.error('Invalid transaction was retrieved, did not pass SPV')
        const units = recent.data.bsv21.amt
        return { units, atomicBEEF: tx.toAtomicBEEF() }
    }

    const updateAddress = useCallback(async (date: Date) => {
        try {
            if (!await wallet.isAuthenticated()) return
            console.log('updating address for date', date)
            const { instructions, change } = await getMNEEAddress(wallet, date)
            setCustomInstructions(instructions as MNEETokenInstructions)
            setAddress(change)
            console.log({ change })
            const balance = await mnee.balance(change)
            setBalance((balance?.decimalAmount || 0))
        } catch (error) {
            console.error('Failed to update address:', error)
        }
    }, [wallet, mnee])

    const getFundingAddress = useCallback(async () => {
        await updateAddress(selectedDate)
    }, [updateAddress, selectedDate])

    const goToPreviousDay = useCallback(() => {
        setSelectedDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(newDate.getDate() - 1)
            return newDate
        })
    }, [])

    const goToNextDay = useCallback(() => {
        setSelectedDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(newDate.getDate() + 1)
            return newDate
        })
    }, [])

    useEffect(() => {
        if (address) {
            updateAddress(selectedDate)
        }
    }, [selectedDate, address, updateAddress])

    const listenForFundsAndInteralize = useCallback(async () => {
        try {
            setLoading(true)
            if (!await wallet.isAuthenticated()) return
            console.log('listening for funds', address)
            const utxos = await mnee.getAllUtxos(address)
            console.log('All UTXOs:', utxos)
            console.log('Total UTXOs found:', utxos.length)

            // Calculate total balance
            const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.data.bsv21.amt, 0)
            console.log('Total balance (atomic):', totalBalance)
            console.log('Total balance (MNEE):', mnee.fromAtomicAmount(totalBalance))

            await Promise.all(utxos.map(async (r) => {
              const { units, atomicBEEF } = await parseUnitsFromRecentUtxos(r)
              if (units === 0) throw new Error('No MNEE tokens found')
              if (!atomicBEEF) throw new Error('Failed to parse transaction')
              const { accepted } = await wallet.internalizeAction({
                  tx: atomicBEEF,
                  description: 'Receive MNEE tokens',
                  labels: ['MNEE'],
                  outputs: [{
                      outputIndex: r.vout,
                      protocol: 'basket insertion',
                      insertionRemittance: {
                          basket: 'MNEE tokens',
                          customInstructions: JSON.stringify(customInstructions),
                          tags: ['MNEE']
                      }
                  }]
              })
              if (!accepted) toast.error('Metanet Desktop rejected a transaction')
              else toast.success(`Funds received: ${mnee.fromAtomicAmount(units)} MNEE`)
            }))
        } catch (error) {
            console.error('Failed to listen for funds:', error instanceof Error ? error.message : error)
        } finally {
            setLoading(false)
        }
    }, [wallet, mnee, address, customInstructions])

    return (
        <Stack direction="column" alignItems="center" justifyContent="space-between" spacing={3} sx={{ pb: 5 }}>
            {!address 
            ? <>
                <Typography textAlign='center' variant="caption" color="text.secondary">Get MNEE from an external wallet.</Typography>
                <Button variant='contained' onClick={getFundingAddress}>Create Deposit Address</Button> 
            </>
            : <>
                <Typography variant="subtitle1">Send MNEE to your Metanet Wallet</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Button onClick={goToPreviousDay} startIcon={<ArrowBackIcon />} />
                    <Typography variant="h6">{selectedDate.toDateString()}</Typography>
                    <Button onClick={goToNextDay} startIcon={<ArrowForwardIcon />} />
                </Stack>
                <QRCodeCanvas value={address} size={160} />
                <Typography variant="body1">{address}</Typography>
                <Typography variant="caption" color="text.secondary">Balance {balance.toLocaleString(['en-US'], { style: 'currency', currency: 'USD' })}</Typography>
                <Typography variant="overline">Only Send MNEE</Typography>
                <Button variant='contained' disabled={loading} onClick={listenForFundsAndInteralize}>Check For Incoming Funds</Button>
            </>}
            {loading && <CircularProgress />}
        </Stack>
    )
}

export default FundMetanet
