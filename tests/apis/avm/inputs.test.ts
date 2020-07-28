import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { Input, SecpInput, TransferableInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import {
  Output, SecpOutput, AmountOutput, TransferableOutput,
} from 'src/apis/avm/outputs';
import { AVMConstants } from 'src/apis/avm/types';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Inputs', () => {
  let set:UTXOSet;
  let keymgr1:AVMKeyChain;
  let keymgr2:AVMKeyChain;
  let addrs1:Array<Buffer>;
  let addrs2:Array<Buffer>;
  let utxos:Array<UTXO>;
  const amnt:number = 10000;
  beforeEach(() => {
    set = new UTXOSet();
    keymgr1 = new AVMKeyChain('X');
    keymgr2 = new AVMKeyChain('X');
    addrs1 = [];
    addrs2 = [];
    utxos = [];
    for (let i:number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey());
      addrs2.push(keymgr2.makeKey());
    }
    const amount:BN = new BN(amnt);
    const addresses:Array<Buffer> = keymgr1.getAddresses();
    const fallAddresses:Array<Buffer> = keymgr2.getAddresses();
    const locktime:BN = new BN(54321);
    const fallLocktime:BN = locktime.add(new BN(50));
    const threshold:number = 3;
    const fallThreshold:number = 1;

    for (let i:number = 0; i < 3; i++) {
      const txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
      const txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
      const assetID:Buffer = Buffer.from(createHash('sha256').update(txid).digest());
      const out:Output = new SecpOutput(amount.add(new BN(i)), locktime, threshold, addresses);
      const xferout:TransferableOutput = new TransferableOutput(assetID, out);
      const u:UTXO = new UTXO(txid, txidx, assetID, out);
      u.fromBuffer(Buffer.concat([txid, txidx, xferout.toBuffer()]));
      utxos.push(u);
    }
    set.addArray(utxos);
  });
  test('SecpInput', () => {
    let u:UTXO;
    let txid:Buffer;
    let txidx:Buffer;
    const amount:BN = new BN(amnt);
    let input:SecpInput;
    let xferinput:TransferableInput;

    u = utxos[0];
    txid = u.getTxID();
    txidx = u.getOutputIdx();
    const asset = u.getAssetID();

    input = new SecpInput(amount);
    xferinput = new TransferableInput(txid, txidx, asset, input);
    expect(xferinput.getUTXOID()).toBe(u.getUTXOID());
    expect(input.getInputID()).toBe(AVMConstants.SECPINPUTID);

    input.addSignatureIdx(0, addrs2[0]);
    input.addSignatureIdx(1, addrs2[1]);

    const newin:SecpInput = new SecpInput();
    newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
    expect(newin.toBuffer().toString('hex')).toBe(input.toBuffer().toString('hex'));
    expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
  });

  test('Input comparitor', () => {
    const inpt1:SecpInput = new SecpInput((utxos[0].getOutput() as AmountOutput).getAmount());

    const inpt2:SecpInput = new SecpInput((utxos[1].getOutput() as AmountOutput).getAmount());

    const inpt3:SecpInput = new SecpInput((utxos[2].getOutput() as AmountOutput).getAmount());

    const cmp = Input.comparator();
    expect(cmp(inpt1, inpt2)).toBe(-1);
    expect(cmp(inpt1, inpt3)).toBe(-1);
    expect(cmp(inpt1, inpt1)).toBe(0);
    expect(cmp(inpt2, inpt2)).toBe(0);
    expect(cmp(inpt3, inpt3)).toBe(0);
  });

  test('TransferableInput comparitor', () => {
    const inpt1:SecpInput = new SecpInput((utxos[0].getOutput() as AmountOutput).getAmount());
    const in1:TransferableInput = new TransferableInput(utxos[0].getTxID(), utxos[0].getOutputIdx(), utxos[0].getAssetID(), inpt1);

    const inpt2:SecpInput = new SecpInput((utxos[1].getOutput() as AmountOutput).getAmount());
    const in2:TransferableInput = new TransferableInput(utxos[1].getTxID(), utxos[1].getOutputIdx(), utxos[1].getAssetID(), inpt2);

    const inpt3:SecpInput = new SecpInput((utxos[2].getOutput() as AmountOutput).getAmount());
    const in3:TransferableInput = new TransferableInput(utxos[2].getTxID(), utxos[2].getOutputIdx(), utxos[2].getAssetID(), inpt3);

    const cmp = TransferableInput.comparator();
    expect(cmp(in1, in2)).toBe(-1);
    expect(cmp(in1, in3)).toBe(-1);
    expect(cmp(in1, in1)).toBe(0);
    expect(cmp(in2, in2)).toBe(0);
    expect(cmp(in3, in3)).toBe(0);
  });
});
