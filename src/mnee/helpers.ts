import { Transaction, Utils } from "@bsv/sdk";
import { TokenTransfer } from '../mnee/TokenTransfer'

export const prodApprover = '020a177d6a5e6f3a8689acd2e313bd1cf0dcf5a243d1cc67b7218602aee9e04b2f'
export const prodAddress = '1inHbiwj2jrEcZPiSYnfgJ8FmS1Bmk4Dh'
export const prodTokenId = 'ae59f3b898ec61acbdb6cc7a245fabeded0c094bf046f35206a3aec60ef88127_0'

export const draftTx = async () => {
    const tx = new Transaction(1, [], [], 0);
      let tokensIn = 0;
      const signingAddresses: string[] = [];
      let changeAddress = '';

      while (tokensIn < totalAtomicTokenAmount + fee) {
        const utxo = utxos.shift();
        if (!utxo) return { error: 'Insufficient MNEE balance' };

        const sourceTransaction = await this.fetchBeef(utxo.txid);
        if (!sourceTransaction) return { error: 'Failed to fetch source transaction' };

        signingAddresses.push(utxo.owners[0]);
        changeAddress = changeAddress || utxo.owners[0];
        tx.addInput({
          sourceTXID: utxo.txid,
          sourceOutputIndex: utxo.vout,
          sourceTransaction,
          unlockingScript: new TokenTransfer().userUnlock(wallet, customInstructions),
        });
        tokensIn += utxo.data.bsv21.amt;
      }

      for (const req of request) {
        tx.addOutput(await this.createInscription(req.address, this.toAtomicAmount(req.amount), config));
      }
      if (fee > 0) tx.addOutput(await this.createInscription(config.feeAddress, fee, config));

      const change = tokensIn - totalAtomicTokenAmount - fee;
      if (change > 0) {
        tx.addOutput(await this.createInscription(changeAddress, change, config));
      }

      return tx;
}

export const cosignBroadcast = async (tx: Transaction, mneeApiToken: string) => {
  const base64Tx = Utils.toBase64(tx.toBinary());
  const response = await fetch(`${mneeApiToken}/v1/transfer?auth_token=${mneeApiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawtx: base64Tx }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const { rawtx: responseRawtx } = await response.json();
  if (!responseRawtx) return { error: 'Failed to broadcast transaction' };
  return { rawtx: responseRawtx };
};