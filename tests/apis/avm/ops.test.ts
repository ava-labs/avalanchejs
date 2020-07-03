import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import {
  BaseTx, CreateAssetTx, OperationTx, UnsignedTx, Tx,
} from 'src/apis/avm/tx';
import { AVMKeyChain } from 'src/apis/avm/keychain';
import { SecpInput, TransferableInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import { SecpOutput, NFTTransferOutput, TransferableOutput } from 'src/apis/avm/outputs';
import {
  SigIdx, UTXOID, UnixNow, AVMConstants, InitialStates,
} from 'src/apis/avm/types';
import {
  SelectOperationClass, Operation, TransferableOperation, NFTTransferOperation,
} from 'src/apis/avm/ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('Operations', () => {
  const assetID:string = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
  const assetIDBuff:Buffer = Buffer.from(assetID, 'hex');
  const addrs:Array<Buffer> = [
    bintools.avaDeserialize('B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW'),
    bintools.avaDeserialize('P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF'),
    bintools.avaDeserialize('6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV'),
  ].sort();

  const locktime:BN = new BN(54321);
  const addrpay = [addrs[0], addrs[1]];

  const payload:Buffer = Buffer.alloc(1024);
  payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');

  test('SelectOperationClass', () => {
    const nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, locktime, 1, addrs);
    const goodop:NFTTransferOperation = new NFTTransferOperation(nout);
    const operation:Operation = SelectOperationClass(goodop.getOperationID());
    expect(operation).toBeInstanceOf(NFTTransferOperation);
    expect(() => {
      SelectOperationClass(99);
    }).toThrow('Error - SelectOperationClass: unknown opid');
  });

  test('comparator', () => {
    const op1:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1000, payload, locktime, 1, addrs));
    const op2:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(1001, payload, locktime, 1, addrs));
    const op3:NFTTransferOperation = new NFTTransferOperation(new NFTTransferOutput(999, payload, locktime, 1, addrs));
    const cmp = NFTTransferOperation.comparator();
    expect(cmp(op1, op1)).toBe(0);
    expect(cmp(op2, op2)).toBe(0);
    expect(cmp(op3, op3)).toBe(0);
    expect(cmp(op1, op2)).toBe(-1);
    expect(cmp(op1, op3)).toBe(1);
  });

  test('NFTTransferOperation', () => {
    const nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, locktime, 1, addrs);
    const op:NFTTransferOperation = new NFTTransferOperation(nout);

    expect(op.getOperationID()).toBe(AVMConstants.NFTXFEROP);
    expect(op.getOutput().toString()).toBe(nout.toString());

    const opcopy:NFTTransferOperation = new NFTTransferOperation();
    opcopy.fromBuffer(op.toBuffer());
    expect(opcopy.toString()).toBe(op.toString());

    op.addSignatureIdx(0, addrs[0]);
    const sigidx:Array<SigIdx> = op.getSigIdxs();
    expect(sigidx[0].getSource().toString('hex')).toBe(addrs[0].toString('hex'));
    opcopy.fromBuffer(op.toBuffer());
    expect(opcopy.toString()).toBe(op.toString());
  });

  test('TransferableOperation', () => {
    const nout:NFTTransferOutput = new NFTTransferOutput(1000, payload, locktime, 1, addrs);
    const op:NFTTransferOperation = new NFTTransferOperation(nout);
    const nfttxid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(1000), 32)).digest());
    const nftoutputidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(1000), 4));
    const nftutxo:UTXO = new UTXO(nfttxid, nftoutputidx, assetIDBuff, nout);
    const xferop:TransferableOperation = new TransferableOperation(assetIDBuff, [nftutxo.getUTXOID()], op);

    const xferop2:TransferableOperation = new TransferableOperation(assetIDBuff, [Buffer.concat([nfttxid, nftoutputidx])], op);
    const uid:UTXOID = new UTXOID();
    uid.fromString(nftutxo.getUTXOID());
    const xferop3:TransferableOperation = new TransferableOperation(assetIDBuff, [uid], op);

    expect(xferop.getAssetID().toString('hex')).toBe(assetID);
    const utxoiddeserialized:Buffer = bintools.avaDeserialize(xferop.getUTXOIDs()[0].toString());
    expect(bintools.bufferToB58(utxoiddeserialized)).toBe(nftutxo.getUTXOID());
    expect(xferop.getOperation().toString()).toBe(op.toString());

    const opcopy:TransferableOperation = new TransferableOperation();
    opcopy.fromBuffer(xferop.toBuffer());
    expect(opcopy.toString()).toBe(xferop.toString());

    expect(xferop2.toBuffer().toString('hex')).toBe(xferop.toBuffer().toString('hex'));
    expect(xferop3.toBuffer().toString('hex')).toBe(xferop.toBuffer().toString('hex'));
  });
});
