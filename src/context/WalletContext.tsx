import React, { useCallback, useEffect, useState } from "react"
import { WalletClient } from "@bsv/sdk"
import Mnee, { ParseTxResponse } from "mnee"
import { useContext } from "react"

export type WalletContextValue = {
    wallet: WalletClient
    mnee: Mnee
    balance: number
}

const WalletContext = React.createContext<WalletContextValue>({
    wallet: new WalletClient(),
    mnee: new Mnee(),
    balance: 0
})

export function useWallet() {
    return useContext<WalletContextValue>(WalletContext)
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const wallet = new WalletClient()
    const mnee = new Mnee()
    const [balance, setBalance] = useState<number>(0)

    const getBalance = useCallback(async () => {
        await wallet.isAuthenticated()
        const tokens = await wallet.listOutputs({
            basket: 'MNEE tokens',
            include: 'locking scripts'
        })
        console.log({ tokens })
        let total = 0
        await Promise.all(tokens.outputs.map(async token => {
            try {
                const [txid, vout] = token.outpoint.split('.')
                const tx = await mnee.parseTx(txid) as ParseTxResponse
                total += tx.outputs[Number(vout)].amount
            } catch (error) {
                console.error('This does not appear to be a valid MNEE token:', token)
            }
        }))
        setBalance(total)
    }, [wallet, mnee])

    useEffect(() => {
        getBalance()
    }, [])

    return (
        <WalletContext.Provider value={{ wallet, mnee, balance }}>
            {children}
        </WalletContext.Provider>
    )
}