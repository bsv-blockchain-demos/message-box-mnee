import React, { useState, useContext, useMemo, useEffect, useCallback } from "react"
import { WalletClient, ListOutputsResult, Beef, WalletOutput } from "@bsv/sdk"
import Mnee from "mnee"
import { parseInscription } from "../pages/FundMetanet"
import { MneePeerPayClient } from "../p2p/MneePeerPayClient"


const mneeApiToken = import.meta.env.VITE_MNEE_API_TOKEN
const tokenId = import.meta.env.VITE_TOKEN_ID

const wallet = new WalletClient()
const mnee = new Mnee(mneeApiToken)
const mneePeerPayClient = new MneePeerPayClient({
    walletClient: wallet,
    enableLogging: true
})

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
    displayTokens: []
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

    const getBalance = useCallback(async () => {
        const { authenticated } = await wallet.isAuthenticated()
        console.log({ authenticated })
        const ts = await wallet.listOutputs({
            basket: 'MNEE tokens',
            include: 'entire transactions',
            includeCustomInstructions: true
        })
        console.log({ ts })
        setTokens(ts)
        let total = 0
        const disp: any[] = []
        ts.outputs.forEach((token: WalletOutput) => {
            let displayToken: any = { ...token }
            // get the tx from the beef
            const [txid, vout] = token.outpoint.split('.')
            const beef = Beef.fromBinary(ts.BEEF as number[])
            const tx = beef.findAtomicTransaction(txid)
            console.log({ tx })
            if (!tx) return
            const output = tx.outputs[parseInt(vout)]
            if (!output) return
            const script = output.lockingScript
            const inscription = parseInscription(script)
            console.log({ inscription, tokenId })
            if (tokenId !== inscription.id) return
            if (inscription.op !== 'transfer') return
            const amt = parseInt(inscription.amt)
            displayToken.amt = formatToUSD(amt)
            displayToken.txid = txid
            displayToken.vout = vout
            console.log({ displayToken })
            total += amt
            disp.push(displayToken)
        })
        setBalance(total)
        setDisplayTokens(disp)
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
        getBalance
    }), [balance, tokens, displayTokens])

    return (
        <WalletContext.Provider value={walletContextValue}>
            {children}
        </WalletContext.Provider>
    )
}
