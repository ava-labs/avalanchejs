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
import { UnixNow, AVMConstants, InitialStates } from 'src/apis/avm/types';
import { TransferableOperation, NFTTransferOperation } from 'src/apis/avm/ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Transactions', () => {
  let set:UTXOSet;
  let keymgr1:AVMKeyChain;
  let keymgr2:AVMKeyChain;
  let keymgr3:AVMKeyChain;
  let addrs1:Array<Buffer>;
  let addrs2:Array<Buffer>;
  let addrs3:Array<Buffer>;
  let utxos:Array<UTXO>;
  let inputs:Array<TransferableInput>;
  let outputs:Array<TransferableOutput>;
  let ops:Array<TransferableOperation>;
  const amnt:number = 10000;
  const netid:number = 12345;
  const blockchainID:Buffer = Buffer.from(createHash('sha256').update('Foot on the pedal, never ever false metal, engine running hotter than a boiling kettle.').digest());
  const alias:string = 'X';
  const assetID:Buffer = Buffer.from(createHash('sha256').update("Well, now, don't you tell me to smile, you stick around I'll make it worth your while.").digest());
  const NFTassetID:Buffer = Buffer.from(createHash('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
  let amount:BN;
  let addresses:Array<Buffer>;
  let fallAddresses:Array<Buffer>;
  let locktime:BN;
  let fallLocktime:BN;
  let threshold:number;
  let fallThreshold:number;
  const nftutxoids:Array<string> = [];
  beforeEach(() => {
    set = new UTXOSet();
    keymgr1 = new AVMKeyChain(alias);
    keymgr2 = new AVMKeyChain(alias);
    keymgr3 = new AVMKeyChain(alias);
    addrs1 = [];
    addrs2 = [];
    addrs3 = [];
    utxos = [];
    inputs = [];
    outputs = [];
    ops = [];
    for (let i:number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey());
      addrs2.push(keymgr2.makeKey());
      addrs3.push(keymgr3.makeKey());
    }
    amount = new BN(amnt);
    addresses = keymgr1.getAddresses();
    fallAddresses = keymgr2.getAddresses();
    locktime = new BN(54321);
    fallLocktime = locktime.add(new BN(50));
    threshold = 3;
    fallThreshold = 1;

    const payload:Buffer = Buffer.alloc(1024);
    payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');

    for (let i:number = 0; i < 5; i++) {
      let txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
      let txidx:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4));
      const out:SecpOutput = new SecpOutput(amount, locktime, threshold, addresses);
      const xferout:TransferableOutput = new TransferableOutput(assetID, out);
      outputs.push(xferout);

      const u:UTXO = new UTXO(txid, txidx, assetID, out);
      utxos.push(u);

      txid = u.getTxID();
      txidx = u.getOutputIdx();

      const input:SecpInput = new SecpInput(amount);
      const xferin:TransferableInput = new TransferableInput(txid, txidx, assetID, input);
      inputs.push(xferin);

      const nout:NFTTransferOutput = new NFTTransferOutput(1000 + i, payload, locktime, threshold, addresses);
      const op:NFTTransferOperation = new NFTTransferOperation(nout);
      const nfttxid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(1000 + i), 32)).digest());
      const nftutxo:UTXO = new UTXO(nfttxid, 1000 + i, NFTassetID, nout);
      nftutxoids.push(nftutxo.getUTXOID());
      const xferop:TransferableOperation = new TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
      ops.push(xferop);
      utxos.push(nftutxo);
    }
    set.addArray(utxos);
  });

  test('Creation UnsignedTx', () => {
    const baseTx:BaseTx = new BaseTx(netid, blockchainID, outputs, inputs);
    const txu:UnsignedTx = new UnsignedTx(baseTx);
    const txins:Array<TransferableInput> = txu.getTransaction().getIns();
    const txouts:Array<TransferableOutput> = txu.getTransaction().getOuts();
    expect(txins.length).toBe(inputs.length);
    expect(txouts.length).toBe(outputs.length);

    expect(txu.getTransaction().getTxType()).toBe(0);
    expect(txu.getTransaction().getNetworkID()).toBe(12345);
    expect(txu.getTransaction().getBlockchainID().toString('hex')).toBe(blockchainID.toString('hex'));

    let a:Array<string> = [];
    let b:Array<string> = [];
    for (let i:number = 0; i < txins.length; i++) {
      a.push(txins[i].toString());
      b.push(inputs[i].toString());
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));

    a = [];
    b = [];

    for (let i:number = 0; i < txouts.length; i++) {
      a.push(txouts[i].toString());
      b.push(outputs[i].toString());
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));

    const txunew:UnsignedTx = new UnsignedTx();
    txunew.fromBuffer(txu.toBuffer());
    expect(txunew.toBuffer().toString('hex')).toBe(txu.toBuffer().toString('hex'));
    expect(txunew.toString()).toBe(txu.toString());
  });

  test('Creation UnsignedTx Check Amount', () => {
    expect(() => {
      set.buildBaseTx(
        netid, blockchainID,
        new BN(amnt * 1000),
        addrs3, addrs1, addrs1, assetID,
      );
    }).toThrow();
  });

  test('CreateAssetTX', () => {
    const secpbase1:SecpOutput = new SecpOutput(new BN(777), locktime, 1, addrs3);
    const secpbase2:SecpOutput = new SecpOutput(new BN(888), locktime, 1, addrs2);
    const secpbase3:SecpOutput = new SecpOutput(new BN(999), locktime, 1, addrs2);
    const initialState:InitialStates = new InitialStates();
    initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
    initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
    initialState.addOutput(secpbase3, AVMConstants.SECPFXID);
    const name:string = 'Rickcoin is the most intelligent coin';
    const symbol:string = 'RICK';
    const denomination:number = 9;
    const txu:CreateAssetTx = new CreateAssetTx(netid, blockchainID, outputs, inputs, name, symbol, denomination, initialState);
    const txins:Array<TransferableInput> = txu.getIns();
    const txouts:Array<TransferableOutput> = txu.getOuts();
    const initState:InitialStates = txu.getInitialStates();
    expect(txins.length).toBe(inputs.length);
    expect(txouts.length).toBe(outputs.length);
    expect(initState.toBuffer().toString('hex')).toBe(initialState.toBuffer().toString('hex'));

    expect(txu.getTxType()).toBe(AVMConstants.CREATEASSETTX);
    expect(txu.getNetworkID()).toBe(12345);
    expect(txu.getBlockchainID().toString('hex')).toBe(blockchainID.toString('hex'));

    expect(txu.getName()).toBe(name);
    expect(txu.getSymbol()).toBe(symbol);
    expect(txu.getDenomination()).toBe(denomination);
    expect(txu.getDenominationBuffer().readUInt8(0)).toBe(denomination);

    let a:Array<string> = [];
    let b:Array<string> = [];
    for (let i:number = 0; i < txins.length; i++) {
      a.push(txins[i].toString());
      b.push(inputs[i].toString());
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));

    a = [];
    b = [];

    for (let i:number = 0; i < txouts.length; i++) {
      a.push(txouts[i].toString());
      b.push(outputs[i].toString());
    }
    expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));

    const txunew:CreateAssetTx = new CreateAssetTx();
    txunew.fromBuffer(txu.toBuffer());
    expect(txunew.toBuffer().toString('hex')).toBe(txu.toBuffer().toString('hex'));
    expect(txunew.toString()).toBe(txu.toString());
  });

  test('Creation OperationTx', () => {
    const optx:OperationTx = new OperationTx(
      netid, blockchainID, outputs, inputs, ops,
    );
    const txunew:OperationTx = new OperationTx();
    const opbuff:Buffer = optx.toBuffer();
    txunew.fromBuffer(opbuff);
    expect(txunew.toBuffer().toString('hex')).toBe(optx.toBuffer().toString('hex'));
    expect(txunew.toString()).toBe(optx.toString());
    expect(optx.getOperations().length).toBe(5);
  });

  test('Creation Tx1 with asof, locktime, threshold', () => {
    const txu:UnsignedTx = set.buildBaseTx(
      netid, blockchainID,
      new BN(9000),
      addrs3, addrs1, addrs1, assetID,
      UnixNow(), UnixNow().add(new BN(50)), 1,
    );
    const tx:Tx = keymgr1.signTx(txu);

    const tx2:Tx = new Tx();
    tx2.fromString(tx.toString());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });
  test('Creation Tx2 without asof, locktime, threshold', () => {
    const txu:UnsignedTx = set.buildBaseTx(
      netid, blockchainID,
      new BN(9000),
      addrs3, addrs1, addrs1, assetID,
    );
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });

  test('Creation Tx3 using OperationTx', () => {
    const txu:UnsignedTx = set.buildNFTTransferTx(
      netid, blockchainID, assetID, new BN(90),
      addrs1, addresses, addresses, nftutxoids,
      UnixNow(), UnixNow().add(new BN(50)), 1,
    );
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });
});
