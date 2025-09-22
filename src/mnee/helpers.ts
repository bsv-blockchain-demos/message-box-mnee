import {
  Transaction,
  Beef,
  WalletInterface,
  ListOutputsResult,
  CreateActionArgs,
  CreateActionResult,
  CreateActionInput,
  CreateActionOutput
} from "@bsv/sdk";
import { TokenTransfer, MNEETokenInstructions } from '../mnee/TokenTransfer'
import { parseInscription } from "../pages/FundMetanet"
import { PROD_ADDRESS, MNEE_PROXY_API_URL } from './constants'
import Mnee from "@mnee/ts-sdk"

export const fetchBeef = async (txid: string): Promise<number[]> => {
  const beef = await (await fetch(`${MNEE_PROXY_API_URL}/v5/tx/${txid}/beef`)).arrayBuffer()
  const bufferArray = new Uint8Array(beef)
  return Array.from(bufferArray)
}

export const createTx = async (
  wallet: WalletInterface,
  mnee: Mnee,
  tokens: ListOutputsResult,
  address: string,
  units: number,
  changeAddress: string,
  changeInstructions: MNEETokenInstructions
): Promise<{ tx: Transaction, reference: string, error: string | false }> => {
  try {
    let unitsIn = 0

    // do we have any MNEE?
    if (tokens.outputs.length === 0) {
      return { tx: new Transaction(), reference: '', error: 'No MNEE tokens to spend' }
    }

    // Get proper fee calculation from MNEE config
    const config = await mnee.config()
    const transferAtomic = units
    const feeTier = config.fees.find(tier =>
      transferAtomic >= tier.min && transferAtomic <= tier.max
    )

    if (!feeTier) {
      return { tx: new Transaction(), reference: '', error: 'No fee tier found for transfer amount' }
    }

    const fee = feeTier.fee
    console.log(`Transfer fee: ${mnee.fromAtomicAmount(fee)} MNEE`)

    // Prepare inputs - define existing MNEE token UTXOs
    const inputs: CreateActionInput[] = []
    const beef = Beef.fromBinary(tokens.BEEF as number[])

    const tx = new Transaction()

    for (const token of tokens.outputs) {
      if (unitsIn >= units + fee) break

      const [txid, vout] = token.outpoint.split('.')
      const sourceTransaction = beef.findAtomicTransaction(txid)
      if (!sourceTransaction) {
        console.error('Failed to find source transaction')
        return { tx: new Transaction(), reference: '', error: 'Failed to find source transaction' }
      }

      // Get the MNEE amount from inscription
      const output = sourceTransaction.outputs[parseInt(vout)]
      const inscription = parseInscription(output.lockingScript)
      const tokenAmount = parseInt(inscription?.amt || '0')
      unitsIn += tokenAmount

      console.log({ token, inscription, tokenAmount })

      // Define existing input with proper structure for createAction
      inputs.push({
        outpoint: token.outpoint,
        inputDescription: `MNEE token input: ${tokenAmount} units`,
        unlockingScriptLength: 182 // Estimate from TokenTransfer template
      })
    }

    console.log({ unitsIn, units, fee })
    if (unitsIn < units + fee) {
      return { tx: new Transaction(), reference: '', error: 'Insufficient MNEE tokens to spend' }
    }

    const remainder = unitsIn - units - fee

    // Prepare outputs
    const outputs: CreateActionOutput[] = [
      {
        outputDescription: 'Paying MNEE to recipient address',
        lockingScript: new TokenTransfer().lock(address, units).toHex(),
        satoshis: 1
      },
      {
        outputDescription: 'MNEE change output',
        satoshis: 1,
        lockingScript: new TokenTransfer().lock(changeAddress, remainder).toHex(),
        basket: 'MNEE tokens',
        customInstructions: JSON.stringify(changeInstructions),
        tags: ['MNEE', 'change']
      },
      {
        outputDescription: 'MNEE fee paid to service provider',
        lockingScript: new TokenTransfer().lock(PROD_ADDRESS, fee).toHex(),
        satoshis: 1
      }
    ]

    // Create action with proper input/output definitions and noSend option
    const createActionArgs: CreateActionArgs = {
      description: 'Send MNEE tokens',
      inputs,
      outputs,
      inputBEEF: tokens.BEEF,
      options: {
        noSend: true, // Important: don't broadcast yet, needs cosigning
        randomizeOutputs: false
      }
    }

    const actionResult: CreateActionResult = await wallet.createAction(createActionArgs)

    // Check if we got a signable transaction (expected with noSend: true)
    if (actionResult.signableTransaction) {
      // With noSend: true, we get a signableTransaction with atomic BEEF
      // The transaction needs to be signed later using signAction
      // For now, we need to extract the transaction from the BEEF
      const tx = Transaction.fromBEEF(actionResult.signableTransaction.tx)
      
      const stopAfter = inputs.length
      tx.inputs.forEach((input, vin) => {
        if (vin >= stopAfter) return
        const customInstructions = JSON.parse(tokens.outputs[vin].customInstructions || '{}') as MNEETokenInstructions
        input.unlockingScriptTemplate = new TokenTransfer().unlock(wallet, customInstructions, 'all', true)
      })

      await tx.sign()

      console.log({ tx: tx.toHex() })

      return { tx, reference: actionResult.signableTransaction.reference, error: false }

    }

    return { tx: new Transaction(), reference: '', error: 'Failed to create transaction from wallet action' }
  } catch (error) {
    console.error('Error in createTx:', error)
    return {
      tx: new Transaction(),
      reference: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const cosignBroadcast = async (tx: Transaction, mnee: Mnee): Promise<{ tx: Transaction, error: string | false }> => {
  try {
    console.log({ tx: tx.toHex() })
    const rawTxHex = tx.toHex()
    const result = await mnee.submitRawTx(rawTxHex)
    console.log('Ticket ID:', result.ticketId)

    // Check transaction status if we have a ticket ID
    if (result.ticketId) {
      const status = await mnee.getTxStatus(result.ticketId)
      console.log('Transaction ID:', status.tx_id || 'Unknown')
    }

    if (result.rawtx) {
      const returnedTx = Transaction.fromHex(result.rawtx)
      return { tx: returnedTx, error: false }
    }

    return { tx: new Transaction(), error: 'Failed to broadcast transaction' }
  } catch (error) {
    console.error('Failed to submit transaction:', error)
    return { tx: new Transaction(), error: error instanceof Error ? error.message : 'Failed to broadcast transaction' }
  }
}
