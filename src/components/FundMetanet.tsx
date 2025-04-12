import { Stack, Typography } from '@mui/material'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { GetPublicKeyArgs, Utils, Random, PublicKey } from '@bsv/sdk'
import { useWallet } from '../context/WalletContext'

type MNEETokenInstructions = {
    protocolID: number[]
    keyID: string
}

function FundMetanet() {
    const { wallet, mnee, balance } = useWallet()
    const [customInstructions, setCustomInstructions] = useState<MNEETokenInstructions | null>(null)
    const [address, setAddress] = useState<string>('')

    console.log({ wallet, mnee, balance })

    const getFundingAddress = useCallback(async () => {
        try {
            if (!await wallet.isAuthenticated()) return
            console.log('attempting to fund wallet')
            const instructions = {
                protocolID: [2, 'Pay MNEE'],
                keyID: Utils.toHex(Random(16))
            } as GetPublicKeyArgs
            setCustomInstructions(instructions as MNEETokenInstructions)
            const { publicKey } = await wallet.getPublicKey(instructions)
            const a = PublicKey.fromString(publicKey).toAddress()
            setAddress(a)
            console.log({ a })
        } catch (error) {
            console.error('Failed to get funding address:', error)
        }
    }, [wallet, address])

    useEffect(() => {
        getFundingAddress()
    }, [])

    if (!address) return null
    return (
        <Stack direction="column" alignItems="center" justifyContent="space-between" spacing={3}>
            <Typography variant="subtitle1">Send MNEE to your Metanet Wallet</Typography>
            <QRCodeCanvas value={address} size={160} />
            <Typography variant="overline">Only Send MNEE</Typography>
        </Stack>
    )
}

export default FundMetanet
