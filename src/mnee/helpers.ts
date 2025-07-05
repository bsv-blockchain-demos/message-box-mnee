import { Transaction, Utils, Beef, WalletInterface, ListOutputsResult } from "@bsv/sdk";
import { TokenTransfer, MNEETokenInstructions } from '../mnee/TokenTransfer'
import { parseInscription } from "../pages/FundMetanet"
import { PROD_ADDRESS, MNEE_PROXY_API_URL, PUBLIC_PROD_MNEE_API_TOKEN } from './constants'

export const fetchBeef = async (txid: string): Promise<number[]> => {
  const beef = await (await fetch(`${MNEE_PROXY_API_URL}/v5/tx/${txid}/beef`)).arrayBuffer()
  const bufferArray = new Uint8Array(beef)
  return Array.from(bufferArray)
}

export const createTx = async (
  wallet: WalletInterface,
  tokens: ListOutputsResult,
  address: string,
  units: number,
  changeAddress: string): Promise<{ tx: Transaction, error: string | false }> => {
  const tx = new Transaction()
  let unitsIn = 0

  // do we have any MNEE?
  if (tokens.outputs.length === 0) {
    return { tx, error: 'No MNEE tokens to spend' }
  }

  // do we have enough to cover what we're sending and fee?
  for (const token of tokens.outputs) {
    if (unitsIn >= units + 1000) break 
    const [txid, vout] = token.outpoint.split('.')
    const beef = Beef.fromBinary(tokens.BEEF as number[])
    const sourceTransaction = beef.findAtomicTransaction(txid)
    if (!sourceTransaction) {
      console.error('Failed to find source transaction')
      return { tx, error: 'Failed to find source transaction' }
    }
    // for the output of the sourceTransaction, check the MNEE amt value
    const output = sourceTransaction.outputs[parseInt(vout)]
    const inscription = parseInscription(output.lockingScript)
    unitsIn += parseInt(inscription?.amt || '0')
    console.log({ token, inscription })
    const customInstructions = JSON.parse(token?.customInstructions ?? '{}') as MNEETokenInstructions
    tx.addInput({
      sourceTXID: txid,
      sourceOutputIndex: parseInt(vout),
      sourceTransaction,
      unlockingScriptTemplate: new TokenTransfer().unlock(wallet, customInstructions, 'all', true), // ANYONECANPAY
    })
  }
  const fee = (unitsIn >= 1000001) ? 1000 : 100

  console.log({ unitsIn, units })
  if (unitsIn < units + fee) {
    return { tx, error: 'Insufficient MNEE tokens to spend' }
  }

  const remainder = unitsIn - units - fee

  // pay the person you're trying to pay
  tx.addOutput({
    lockingScript: new TokenTransfer().lock(address, units),
    satoshis: 1
  })

  // keep the change yourself.
  tx.addOutput({
    satoshis: 1,
    lockingScript: new TokenTransfer().lock(changeAddress, remainder)
  })

  // this output is to pay the issuer
  tx.addOutput({
    lockingScript: new TokenTransfer().lock(PROD_ADDRESS, fee),
    satoshis: 1
  })

  // get signatures from Metanet Desktop
  await tx.sign()

  return { tx, error: false }
}

export const cosignBroadcast = async (tx: Transaction) => {
  console.log({ tx: tx.toHex() })
  const base64Tx = Utils.toBase64(tx.toBinary())
  const response = await fetch(`${MNEE_PROXY_API_URL}/v1/transfer?auth_token=${PUBLIC_PROD_MNEE_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawtx: base64Tx }),
  })
  if (!response.ok) return { error: new Error(`HTTP error! status: ${response.status}`) }
  const { rawtx: responseRawtx } = await response.json()
  if (!responseRawtx) return { error: new Error('Failed to broadcast transaction') }
  return { tx: Transaction.fromBinary(Utils.toArray(responseRawtx, 'base64')), error: false }
}
