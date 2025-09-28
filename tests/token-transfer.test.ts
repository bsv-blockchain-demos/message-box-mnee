import { describe, it, expect } from 'vitest';
import { TokenTransfer } from '../src/mnee/TokenTransfer';
import { Transaction, MerklePath, P2PKH, PrivateKey, UnlockingScript, Utils, Script, WalletProtocol } from '@bsv/sdk';
import { MockChain, wallet } from './test-utils';

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

    const { instructions, change } = {
      instructions: {
        protocolID: [ 2, 'Pay MNEE' ] as WalletProtocol,
        keyID: 'MjAyNS0wOS0yNQ==',
        counterparty: 'self',
        forSelf: true
      },
      change: '1EL7jA4M4c4UFYimTz7npM25x2dQf4HcfG'
    }

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

    console.log({ sig: tx.inputs[0]!.unlockingScript!.toASM() })

    const sig = Utils.toArray('304402206c49ddaeef9a8d8edd429658be247cdb647c844bddcd811be62cc711b493933302200411f7050b319fb6e73f3b64baaa47770679542b549497635ac8f0916c4d5d54c1', 'hex')
    const replacement = new UnlockingScript()
    replacement.writeBin(sig)
    replacement.writeScript(Script.fromASM(tx.inputs[0]!.unlockingScript!.toASM()))
    tx.inputs[0].unlockingScript = replacement

    const passes = await tx.verify(mockChain)
    expect(passes).toBe(true)    

    console.log({ tx: tx.toHex() })
  });
});