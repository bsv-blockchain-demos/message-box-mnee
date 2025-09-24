import { describe, it, expect } from 'vitest';
import { TokenTransfer } from '../src/mnee/TokenTransfer';
import { Transaction, MerklePath, P2PKH, PrivateKey, UnlockingScript, Utils, Script } from '@bsv/sdk';
import { MockChain, wallet } from './test-utils';
import { getMNEEAddress } from '../src/mnee/getAddress';

const cosigner = PrivateKey.fromHex('065204edc6aef2882ed9ddaaa58c4e35937249afa852fb5ed65bb3988bf1e861')
const cosignerPubKey = cosigner.toPublicKey()

describe('Token Transfer', () => {
  it('should create a valid locking script for MNEE tokens', async () => {
    
    const sourceTransaction = new Transaction()
    sourceTransaction.addInput({
      sourceTXID: '0000000000000000000000000000000000000000000000000000000000000000',
      sourceOutputIndex: 0,
      unlockingScript: UnlockingScript.fromASM('3044022024731d659132cb9cf4768bdbaa3839cec56531979955ef3e4058fcd58d37274002200484424db86ad8cdb55cdc90fbddabbcf3b8386a4ceb042d0ca87834d9e2cfb141 033cd6c077be41bfc5cf83ee6a6cdc821b9247b99bb2d929490b32fc938630fac5')
    })

    const { instructions, change } = await getMNEEAddress(wallet)

    sourceTransaction.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(change, 1000, cosignerPubKey)
    })

    sourceTransaction.addOutput({
      satoshis: 30,
      lockingScript: new P2PKH().lock(cosigner.toAddress())
    })

    const txid = sourceTransaction.id('hex')
    sourceTransaction.merklePath = new MerklePath(0, [[{ txid: true, offset: 0, hash: txid }]])
    const mockChain = new MockChain({ blockheaders: [txid] })

    const tx = new Transaction()
    tx.addInput({
      sourceTransaction,
      sourceOutputIndex: 0,
      unlockingScriptTemplate: new TokenTransfer().unlock(wallet, instructions, 'all', true) 
    })
    tx.addInput({
      sourceTransaction,
      sourceOutputIndex: 1,
      unlockingScriptTemplate: new P2PKH().unlock(cosigner)
    })
    tx.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(change, 900, cosignerPubKey)
    })
    tx.addOutput({
      satoshis: 1,
      lockingScript: new TokenTransfer().lock(change, 100, cosignerPubKey)
    })
    tx.addOutput({
      change: true,
      lockingScript: new P2PKH().lock(cosigner.toAddress())
    })

    await tx.fee(1)
    await tx.sign()

    const sig = Utils.toArray('304402205b5af4cf1d0932fe504415e7ff80a64d14bc2187f05ee03360a6d4344f0ee4b502206c8c4ebdd8c7fdd338b26eb5d4f0d3e3362c6cf17518a8c69d8903ac61e1dd8cc1', 'hex')
    const replacement = new UnlockingScript()
    replacement.writeBin(sig)
    replacement.writeScript(Script.fromASM(tx.inputs[0]!.unlockingScript!.toASM()))
    tx.inputs[0].unlockingScript = replacement

    const passes = await tx.verify(mockChain)
    expect(passes).toBe(true)    

    console.log({ tx: tx.toHex() })
  });
});