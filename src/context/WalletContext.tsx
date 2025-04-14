import React, { useEffect, useState, useContext, useMemo } from "react"
import { WalletClient, ListOutputsResult, Beef, WalletOutput } from "@bsv/sdk"
import Mnee from "mnee"
import { prodTokenId } from "../mnee/helpers"
import { parseInscription } from "../pages/FundMetanet"

export type WalletContextValue = {
    wallet: WalletClient
    mnee: Mnee
    balance: number
    tokens: ListOutputsResult
    getBalance: () => void
    setTokens: (tokens: ListOutputsResult) => void
    displayTokens: any[]
    setDisplayTokens: (tokens: any[]) => void
}

const WalletContext = React.createContext<WalletContextValue>({
    wallet: new WalletClient(),
    mnee: new Mnee(),
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
    const wallet = new WalletClient()
    const mnee = new Mnee()
    const [balance, setBalance] = useState<number>(0)
    const [tokens, setTokens] = useState<ListOutputsResult>({} as ListOutputsResult)
    const [displayTokens, setDisplayTokens] = useState<any[]>([])

    const getBalance = async () => {
        await wallet.isAuthenticated()
        const ts = await wallet.listOutputs({
            basket: 'MNEE tokens',
            include: 'entire transactions',
            includeCustomInstructions: true
        })
        const spendable = { ...ts }
        const spendableTokens = spendable.outputs.filter(token => token.spendable)
        spendable.outputs = spendableTokens
        setTokens(spendable)
        let total = 0
        const disp: any[] = []
        spendable.outputs.forEach((token: WalletOutput) => {
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
            if (prodTokenId !== inscription.id) return
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
    }

    useEffect(() => {
        getBalance()
    }, [])

    const walletContextValue = useMemo(() => ({
        wallet,
        mnee,
        balance,
        tokens,
        setTokens,
        displayTokens,
        setDisplayTokens,
        getBalance,
    }), [wallet, balance, tokens, displayTokens])

    return (
        <WalletContext.Provider value={walletContextValue}>
            {children}
        </WalletContext.Provider>
    )
}
