import React, { useState, useContext, useMemo, useEffect, useCallback } from "react"
import { WalletClient, ListOutputsResult, Beef, WalletOutput } from "@bsv/sdk"
import Mnee from "@mnee/ts-sdk"
import { parseInscription } from "../pages/FundMetanet"
import { MneePeerPayClient } from "../p2p/MneePeerPayClient"
import { PROD_TOKEN_ID, MNEE_API_KEY, MNEE_ENVIRONMENT } from "../mnee/constants"
import { MNEEConfig } from "@mnee/ts-sdk"

const wallet = new WalletClient()
const mnee = new Mnee({
    environment: MNEE_ENVIRONMENT as 'production' | 'sandbox',
    apiKey: MNEE_API_KEY
})

const mneePeerPayClient = new MneePeerPayClient({
    walletClient: wallet,
    enableLogging: true
}, mnee)

export type WalletContextValue = {
    wallet: WalletClient
    mnee: Mnee
    balance: number
    tokens: ListOutputsResult
    getBalance: () => void
    setTokens: (tokens: ListOutputsResult) => void
    displayTokens: any[]
    setDisplayTokens: (tokens: any[]) => void
    mneePeerPayClient: MneePeerPayClient
    config: MNEEConfig
}

const WalletContext = React.createContext<WalletContextValue>({
    wallet,
    mnee,
    mneePeerPayClient,
    balance: 0,
    getBalance: () => {},
    tokens: {} as ListOutputsResult,
    setTokens: () => {},
    setDisplayTokens: () => {},
    displayTokens: [],
    config: {} as MNEEConfig
})

export function useWallet() {
    return useContext<WalletContextValue>(WalletContext)
}

export const formatToUSD = (amt: number | undefined) => {
    if (!amt) return '$0.00'
    return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 5
    }).format(amt / 100000)
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [balance, setBalance] = useState<number>(0)
    const [tokens, setTokens] = useState<ListOutputsResult>({} as ListOutputsResult)
    const [displayTokens, setDisplayTokens] = useState<any[]>([])
    const [config, setConfig] = useState<MNEEConfig>({} as MNEEConfig)

    const getBalance = useCallback(async () => {
        try {
            const config = await mnee.config()
            setConfig(config)
            const ts = await wallet.listOutputs({
                basket: 'MNEE tokens',
                include: 'entire transactions',
                includeCustomInstructions: true
            })
            setTokens(ts)
            let total = 0
            const disp: any[] = []
            ts.outputs.forEach((token: WalletOutput) => {
                let displayToken: any = { ...token }
                // get the tx from the beef
                const [txid, vout] = token.outpoint.split('.')
                const beef = Beef.fromBinary(ts.BEEF as number[])
                const tx = beef.findAtomicTransaction(txid)
                if (!tx) return
                const output = tx.outputs[parseInt(vout)]
                if (!output) return
                const script = output.lockingScript
                const inscription = parseInscription(script)
                if (PROD_TOKEN_ID !== inscription.id) return
                if (inscription.op !== 'transfer') return
                const amt = parseInt(inscription.amt)
                displayToken.amt = formatToUSD(amt)
                displayToken.txid = txid
                displayToken.vout = vout
                total += amt
                disp.push(displayToken)
            })
            setBalance(total)
            setDisplayTokens(disp)
        } catch (error) {
            console.error('Error getting balance', error)
        }
    }, [wallet, mnee, mneePeerPayClient])

    useEffect(() => {
        getBalance()
    }, [])

    const walletContextValue = useMemo(() => ({
        wallet,
        mnee,
        mneePeerPayClient,
        balance,
        tokens,
        setTokens,
        displayTokens,
        setDisplayTokens,
        getBalance,
        config
    }), [balance, tokens, displayTokens, config])

    return (
        <WalletContext.Provider value={walletContextValue}>
            {children}
        </WalletContext.Provider>
    )
}
