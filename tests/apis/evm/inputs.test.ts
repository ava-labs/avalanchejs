import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { KeyChain } from 'src/apis/avm/keychain';
import { SECPTransferInput, TransferableInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import {
  SECPTransferOutput, AmountOutput, TransferableOutput,
} from 'src/apis/avm/outputs';
import { EVMConstants } from 'src/apis/evm/constants';
import { Input } from 'src/common/input';
import { Output } from 'src/common/output';
import { EVMInput } from 'src/apis/evm';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Inputs', () => {
  let set: UTXOSet;
  let keymgr1: KeyChain;
  let keymgr2: KeyChain;
  let addrs1: Buffer[];
  let addrs2: Buffer[];
  let utxos: UTXO[];
  let hrp: string = "tests";
  const amnt: number = 10000;
  beforeEach(() => {
    set = new UTXOSet();
    keymgr1 = new KeyChain(hrp, 'C');
    keymgr2 = new KeyChain(hrp, 'C');
    addrs1 = [];
    addrs2 = [];
    utxos = [];
    for (let i: number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey().getAddress());
      addrs2.push(keymgr2.makeKey().getAddress());
    }
    const amount: BN = new BN(amnt);
    const addresses: Buffer[] = keymgr1.getAddresses();
    const locktime: BN = new BN(54321);
    const threshold: number = 3;

    for (let i: number = 0; i < 3; i++) {
      const txid: Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
      const txidx: Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
      const assetID: Buffer = Buffer.from(createHash('sha256').update(txid).digest());
      const out: Output = new SECPTransferOutput(amount.add(new BN(i)), addresses, locktime, threshold);
      const xferout: TransferableOutput = new TransferableOutput(assetID, out);
      const u: UTXO = new UTXO(EVMConstants.LATESTCODEC, txid, txidx, assetID, out);
      u.fromBuffer(Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
      utxos.push(u);
    }
    set.addArray(utxos);
  });
  test('SECPInput', () => {
    let u: UTXO;
    let txid: Buffer;
    let txidx: Buffer;
    const amount: BN = new BN(amnt);
    let input: SECPTransferInput;
    let xferinput: TransferableInput;

    u = utxos[0];
    txid = u.getTxID();
    txidx = u.getOutputIdx();
    const asset = u.getAssetID();

    input = new SECPTransferInput(amount);
    xferinput = new TransferableInput(txid, txidx, asset, input);
    expect(xferinput.getUTXOID()).toBe(u.getUTXOID());
    expect(input.getInputID()).toBe(EVMConstants.SECPINPUTID);

    input.addSignatureIdx(0, addrs2[0]);
    input.addSignatureIdx(1, addrs2[1]);

    const newin: SECPTransferInput = new SECPTransferInput();
    newin.fromBuffer(bintools.b58ToBuffer(input.toString()));
    expect(newin.toBuffer().toString('hex')).toBe(input.toBuffer().toString('hex'));
    expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString());
  });

  test('Input comparator', () => {
    const inpt1: SECPTransferInput = new SECPTransferInput((utxos[0].getOutput() as AmountOutput).getAmount());

    const inpt2: SECPTransferInput = new SECPTransferInput((utxos[1].getOutput() as AmountOutput).getAmount());

    const inpt3: SECPTransferInput = new SECPTransferInput((utxos[2].getOutput() as AmountOutput).getAmount());

    const cmp = Input.comparator();
    expect(cmp(inpt1, inpt2)).toBe(-1);
    expect(cmp(inpt1, inpt3)).toBe(-1);
    expect(cmp(inpt1, inpt1)).toBe(0);
    expect(cmp(inpt2, inpt2)).toBe(0);
    expect(cmp(inpt3, inpt3)).toBe(0);
  });

  test('TransferableInput comparator', () => {
    const inpt1: SECPTransferInput = new SECPTransferInput((utxos[0].getOutput() as AmountOutput).getAmount());
    const in1: TransferableInput = new TransferableInput(utxos[0].getTxID(), utxos[0].getOutputIdx(), utxos[0].getAssetID(), inpt1);

    const inpt2: SECPTransferInput = new SECPTransferInput((utxos[1].getOutput() as AmountOutput).getAmount());
    const in2: TransferableInput = new TransferableInput(utxos[1].getTxID(), utxos[1].getOutputIdx(), utxos[1].getAssetID(), inpt2);

    const inpt3: SECPTransferInput = new SECPTransferInput((utxos[2].getOutput() as AmountOutput).getAmount());
    const in3: TransferableInput = new TransferableInput(utxos[2].getTxID(), utxos[2].getOutputIdx(), utxos[2].getAssetID(), inpt3);

    const cmp = TransferableInput.comparator();
    expect(cmp(in1, in2)).toBe(-1);
    expect(cmp(in1, in3)).toBe(-1);
    expect(cmp(in1, in1)).toBe(0);
    expect(cmp(in2, in2)).toBe(0);
    expect(cmp(in3, in3)).toBe(0);
  });

  test('EVMInput comparator', () => {
    const address1: string = "X-local1n8cjyy4hdw96dsvdsdf9mcuswu4wq333gqtfq2";
    const address2: string = "X-local17pm5mywjrdvkz8c3f25ll0tmshs900qf0wrwxc";
    const address3: string = "X-local1u9z02vhut6ur5gvt8xh2g3e4xaadt2h37u3zqe";
    const amount1: number = 1;
    const amount2: number = 2;
    const amount3: number = 3;
    const assetID1: string = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe";
    const assetID2: string = "vvKCjrpggyQ8FhJ2D5EAKPh8x8y4JK93JQiWRpTKpEouydRbG";
    const assetID3: string = "eRo1eb2Yxd87KuMYANBSha3n138wtqRhFz2xjftsXWnmpCxyh";
    const nonce1: number = 0;
    const nonce2: number = 1;
    const nonce3: number = 2;

    const inpt1: EVMInput = new EVMInput(address1, amount1, assetID1, nonce1);
    const inpt2: EVMInput = new EVMInput(address2, amount2, assetID2, nonce2);
    const inpt3: EVMInput = new EVMInput(address3, amount3, assetID3, nonce3);

    const cmp = EVMInput.comparator();
    expect(cmp(inpt1, inpt2)).toBe(-1);
    expect(cmp(inpt1, inpt3)).toBe(-1);
    expect(cmp(inpt2, inpt3)).toBe(-1);
    expect(cmp(inpt1, inpt1)).toBe(0);
    expect(cmp(inpt2, inpt2)).toBe(0);
    expect(cmp(inpt3, inpt3)).toBe(0);
    expect(cmp(inpt2, inpt1)).toBe(1);
    expect(cmp(inpt3, inpt1)).toBe(1);
    expect(cmp(inpt3, inpt2)).toBe(1);
  });
});
