import { describe, it, expect } from 'vitest';
import { TokenTransfer } from '../src/mnee/TokenTransfer';
import { Transaction, MerklePath, P2PKH, PrivateKey, UnlockingScript, Utils, Script, WalletProtocol, WalletClient, Hash, TransactionSignature, Signature, PublicKey } from '@bsv/sdk';
import { MockChain, wallet } from './test-utils';
import { getMNEEAddress } from '../src/mnee/getAddress'
import { MNEETokenInstructions } from '../src/mnee/TokenTransfer'

const cosigner = PrivateKey.fromHex('065204edc6aef2882ed9ddaaa58c4e35937249afa852fb5ed65bb3988bf1e861')
const cosignerPubKey = cosigner.toPublicKey()
const mockChain = new MockChain({ blockheaders: [] })
const sourceTransaction = new Transaction()
let customInstructions: MNEETokenInstructions
let changeAddress: string

describe('Token Transfer', () => {
  beforeAll(async () => {
    sourceTransaction.addInput({
      sourceTXID: '0000000000000000000000000000000000000000000000000000000000000000',
      sourceOutputIndex: 0,
      unlockingScript: UnlockingScript.fromASM('3044022024731d659132cb9cf4768bdbaa3839cec56531979955ef3e4058fcd58d37274002200484424db86ad8cdb55cdc90fbddabbcf3b8386a4ceb042d0ca87834d9e2cfb141 033cd6c077be41bfc5cf83ee6a6cdc821b9247b99bb2d929490b32fc938630fac5')
    })

    const { instructions, change } = await getMNEEAddress(wallet)
    customInstructions = instructions
    changeAddress = change

    sourceTransaction.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(changeAddress, 1000, cosignerPubKey)
    })

    sourceTransaction.addOutput({
      satoshis: 30,
      lockingScript: new P2PKH().lock(cosigner.toAddress())
    })

    const txid = sourceTransaction.id('hex')
    sourceTransaction.merklePath = new MerklePath(0, [[{ txid: true, offset: 0, hash: txid }]])
    mockChain.addBlock(txid)
  })

  it('should create a valid locking script for MNEE tokens', async () => {
    const tx = new Transaction()
    tx.addInput({
      sourceTransaction,
      sourceOutputIndex: 0,
      unlockingScriptTemplate: new TokenTransfer().unlock(wallet, customInstructions, 'all', true, undefined, undefined, cosigner) 
    })
    tx.addInput({
      sourceTransaction,
      sourceOutputIndex: 1,
      unlockingScriptTemplate: new P2PKH().unlock(cosigner)
    })
    tx.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(changeAddress, 900, cosignerPubKey)
    })
    tx.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(changeAddress, 100, cosignerPubKey)
    })
    tx.addOutput({
      change: true,
      lockingScript: new P2PKH().lock(cosigner.toAddress())
    })

    await tx.fee(1)
    await tx.sign()

    console.log({ sig: tx.inputs[0]!.unlockingScript!.toASM() })

    const passes = await tx.verify(mockChain)
    expect(passes).toBe(true)    

    console.log({ tx: tx.toHex() })
  });
});