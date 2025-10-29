import {
  Transaction,
  Beef,
  WalletInterface,
  ListOutputsResult,
  TransactionInput,
  TransactionOutput,
  PublicKey
} from "@bsv/sdk";
import { TokenTransfer, MNEETokenInstructions } from '../mnee/TokenTransfer'
import { parseInscription } from "../pages/FundMetanet"
import Mnee, { MNEEConfig } from "@mnee/ts-sdk"
import { PROD_APPROVER, PROD_TOKEN_ID } from "./constants"

const approver = PublicKey.fromString(PROD_APPROVER)

export const fetchBeef = async (txid: string): Promise<Transaction> => {
  const beef = await (await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/beef`)).text()
  return Transaction.fromHexBEEF(beef)
}

export const createTx = async (
  wallet: WalletInterface,
  mnee: Mnee,
  tokens: ListOutputsResult,
  address: string,
  units: number,
  changeAddress: string,
  config: MNEEConfig
): Promise<{ tx: Transaction, error: string | false }> => {
  try {
    let unitsIn = 0

    // do we have any MNEE?
    if (tokens.outputs.length === 0) {
      return { tx: new Transaction(), error: 'No MNEE tokens to spend' }
    }

    // Get proper fee calculation from MNEE config
    const transferAtomic = units
    const feeTier = config.fees.find(tier =>
      transferAtomic >= tier.min && transferAtomic <= tier.max
    )

    if (!feeTier) {
      return { tx: new Transaction(), error: 'No fee tier found for transfer amount' }
    }

    const fee = feeTier.fee
    console.log(`Transfer fee: ${mnee.fromAtomicAmount(fee)} MNEE`)

    // Prepare inputs - define existing MNEE token UTXOs
    const inputs: TransactionInput[] = []
    const beef = Beef.fromBinary(tokens.BEEF as number[])

    for (const token of tokens.outputs) {
      if (unitsIn >= units + fee) break

      const [txid, vout] = token.outpoint.split('.')
      const sourceTransaction = beef.findAtomicTransaction(txid)
      if (!sourceTransaction) {
        console.error('Failed to find source transaction')
        return { tx: new Transaction(), error: 'Failed to find source transaction' }
      }

      // Get the MNEE amount from inscription
      const sourceOutputIndex = parseInt(vout)
      const output = sourceTransaction.outputs[sourceOutputIndex]
      const inscription = parseInscription(output.lockingScript)
      const tokenAmount = parseInt(inscription?.amt || '0')
      unitsIn += tokenAmount

      console.log({ token, inscription, tokenAmount })

      // Define existing input with proper structure for createAction
      const customInstructions = JSON.parse(token.customInstructions || '{}') as MNEETokenInstructions
      inputs.push({
        sourceTransaction,
        sourceOutputIndex,
        unlockingScriptTemplate: new TokenTransfer().unlock(wallet, customInstructions, 'all', true),
        sequence: 0xffffffff
      })
    }

    console.log({ unitsIn, units, fee })
    if (unitsIn < units + fee) {
      return { tx: new Transaction(), error: 'Insufficient MNEE tokens to spend' }
    }

    const remainder = unitsIn - units - fee
   
    // Prepare outputs
    const outputs: TransactionOutput[] = [
      {
        lockingScript: new TokenTransfer().lock(address, units, approver, PROD_TOKEN_ID),
        satoshis: 1
      },
      {
        lockingScript: new TokenTransfer().lock(changeAddress, remainder, approver, PROD_TOKEN_ID),
        satoshis: 1
      },
      {
        lockingScript: new TokenTransfer().lock(config.feeAddress, fee, approver, PROD_TOKEN_ID),
        satoshis: 1
      }
    ]

    const tx = new Transaction(1, inputs, outputs)
      
    await tx.sign()
    console.log({ signed: tx.toHex() })

    return { tx, error: false }
  } catch (error) {
    console.error('Error in createTx:', error)
    return {
      tx: new Transaction(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const cosignBroadcast = async (tx: Transaction, mnee: Mnee): Promise<{ tx: Transaction, error: string | false }> => {
  try {
    const rawTxHex = tx.toHex()
    const result = await mnee.submitRawTx(rawTxHex, { broadcast: true })
    console.log({ result })

    // Check transaction status if we have a ticket ID
    if (result.ticketId) {
      // Wait 2 seconds before first check
      await new Promise(resolve => setTimeout(resolve, 2000))

      let status
      let attempts = 0
      do {
        status = await mnee.getTxStatus(result.ticketId)
        console.log({ status })
        attempts++
        if (!status.tx_hex && attempts < 10) {
          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } while (!status.tx_hex && attempts < 10)

      if (!status.tx_hex) {
        return { tx: new Transaction(), error: 'Failed to broadcast transaction' }
      }

      const returnedTx = Transaction.fromHex(status.tx_hex)
      await Promise.all(returnedTx.inputs.map(async (input, vin) => {
        let sourceTransaction = tx.inputs?.[vin]?.sourceTransaction
        if (!sourceTransaction) {
          console.log('retrieving source tx:', returnedTx.inputs[vin]!.sourceTXID)
          sourceTransaction = await fetchBeef(returnedTx.inputs[vin]!.sourceTXID!)
        }
        input.sourceTransaction = sourceTransaction
      }))
      return { tx: returnedTx, error: false }
    }
    return { tx: new Transaction(), error: 'Failed to broadcast transaction' }
  } catch (error) {
    console.error('Failed to submit transaction:', error)
    return { tx: new Transaction(), error: error instanceof Error ? error.message : 'Failed to broadcast transaction' }
  }
}
