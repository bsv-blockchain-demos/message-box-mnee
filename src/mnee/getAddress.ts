import { GetPublicKeyArgs, PublicKey, Utils, WalletInterface } from "@bsv/sdk";
import { MNEETokenInstructions } from "./TokenTransfer";

export const getMNEEAddress = async (wallet: WalletInterface, date?: Date) : Promise<{ instructions: MNEETokenInstructions, change: string }> => {
    try {
        console.log('creating change address')
        const targetDate = date || new Date()
        const instructions = {
            protocolID: [2, 'Pay MNEE'],
            keyID: Utils.toBase64(Utils.toArray(targetDate.toISOString().slice(0,10), 'utf8')),
            counterparty: 'self',
            forSelf: true
        } as GetPublicKeyArgs
        const { publicKey } = await wallet.getPublicKey(instructions)
        return { instructions: instructions as MNEETokenInstructions, change: PublicKey.fromString(publicKey).toAddress() }
    } catch (error) {
        console.error('Failed to get change address:', error)
        return { instructions: {} as MNEETokenInstructions, change: '' }
    }
}