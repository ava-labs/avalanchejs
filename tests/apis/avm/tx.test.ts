import mockAxios from 'jest-mock-axios';
import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import AVMAPI from 'src/apis/avm/api';
import {
  BaseTx, CreateAssetTx, OperationTx, UnsignedTx, Tx, ImportTx, ExportTx 
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
import { Avalanche } from 'src/index';
import { UTF8Payload } from 'src/utils/payload';

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
  let importIns:Array<TransferableInput>;
  let exportOuts:Array<TransferableOutput>;
  let fungutxos:Array<UTXO>;
  let exportUTXOIDS:Array<string>;
  let api:AVMAPI;
  const amnt:number = 10000;
  const netid:number = 12345;
  const memo:Buffer = bintools.stringToBuffer("Avalanche.js");
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
  const ip = '127.0.0.1';
  const port = 8080;
  const protocol = 'http';
  let avalanche:Avalanche;
  const blockchainid:string = '6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF';
  const name:string = 'Mortycoin is the dumb as a sack of hammers.';
  const symbol:string = 'morT';
  const denomination:number = 8;
  let avaxAssetID:Buffer;

  beforeAll(async () => {
    avalanche = new Avalanche(ip, port, protocol, 12345, undefined, null, true);
    api = new AVMAPI(avalanche, '/ext/bc/avm', blockchainid);

    const result:Promise<Buffer> = api.getAVAXAssetID();
    const payload:object = {
      result: {
        name,
        symbol,
        assetID: bintools.cb58Encode(assetID),
        denomination: `${denomination}`,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    avaxAssetID = await result;
  });

  beforeEach(() => {
    set = new UTXOSet();
    keymgr1 = new AVMKeyChain(avalanche.getHRP(), alias);
    keymgr2 = new AVMKeyChain(avalanche.getHRP(), alias);
    keymgr3 = new AVMKeyChain(avalanche.getHRP(), alias);
    addrs1 = [];
    addrs2 = [];
    addrs3 = [];
    utxos = [];
    inputs = [];
    outputs = [];
    importIns = [];
    exportOuts = [];
    fungutxos = [];
    exportUTXOIDS = [];
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
      const out:SecpOutput = new SecpOutput(amount, addresses, locktime, threshold);
      const xferout:TransferableOutput = new TransferableOutput(assetID, out);
      outputs.push(xferout);

      const u:UTXO = new UTXO(AVMConstants.LATESTCODEC, txid, txidx, assetID, out);
      utxos.push(u);
      fungutxos.push(u);

      txid = u.getTxID();
      txidx = u.getOutputIdx();

      const input:SecpInput = new SecpInput(amount);
      const xferin:TransferableInput = new TransferableInput(txid, txidx, assetID, input);
      inputs.push(xferin);

      const nout:NFTTransferOutput = new NFTTransferOutput(1000 + i, payload, addresses, locktime, threshold);
      const op:NFTTransferOperation = new NFTTransferOperation(nout);
      const nfttxid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(1000 + i), 32)).digest());
      const nftutxo:UTXO = new UTXO(AVMConstants.LATESTCODEC,nfttxid, 1000 + i, NFTassetID, nout);
      nftutxoids.push(nftutxo.getUTXOID());
      const xferop:TransferableOperation = new TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
      ops.push(xferop);
      utxos.push(nftutxo);
    }
    for(let i:number = 1; i < 4; i++){
      importIns.push(inputs[i]);
      exportOuts.push(outputs[i]);
      exportUTXOIDS.push(fungutxos[i].getUTXOID());
    }
    set.addArray(utxos);
  });

  test('Create small BaseTx that is Goose Egg Tx', async () => {
    const bintools: BinTools = BinTools.getInstance();
    const networkID: number = 12345;
    const blockchainID:Buffer = bintools.cb58Decode("2oALd6xoUMp3oSHMiJYVqMcbaWxGQWYosrfiT7AaFKKNG5dmKD");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("266");
    const output:SecpOutput = new SecpOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SecpInput = new SecpInput(inputAmt);
    input.addSignatureIdx(0, addrs1[0]);
    const txid:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outputIndex:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(0), 4));
    const transferableInput:TransferableInput = new TransferableInput(txid, outputIndex, avaxAssetID, input);
    ins.push(transferableInput);
    const baseTx:BaseTx = new BaseTx(networkID, blockchainID, outs, ins);
    const unsignedTx:UnsignedTx = new UnsignedTx(baseTx);
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true);
  });

  test('confirm inputTotal, outputTotal and fee are correct', async () => {
    const bintools: BinTools = BinTools.getInstance();
    const networkID: number = 12345;
    // local network X Chain ID
    const blockchainID:Buffer = bintools.cb58Decode("2oALd6xoUMp3oSHMiJYVqMcbaWxGQWYosrfiT7AaFKKNG5dmKD");
    // AVAX assetID
    const assetID:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("266");
    const output:SecpOutput = new SecpOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(assetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SecpInput = new SecpInput(inputAmt);
    input.addSignatureIdx(0, addrs1[0]);
    const txid:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outputIndex:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(0), 4));
    const transferableInput:TransferableInput = new TransferableInput(txid, outputIndex, assetID, input);
    ins.push(transferableInput);
    const baseTx:BaseTx = new BaseTx(networkID, blockchainID, outs, ins);
    const unsignedTx:UnsignedTx = new UnsignedTx(baseTx);
    const inputTotal:BN = unsignedTx.getInputTotal(assetID);
    const outputTotal:BN = unsignedTx.getOutputTotal(assetID);
    const burn:BN = unsignedTx.getBurn(assetID);
    expect(inputTotal.toNumber()).toEqual(new BN(400).toNumber());
    expect(outputTotal.toNumber()).toEqual(new BN(266).toNumber());
    expect(burn.toNumber()).toEqual(new BN(134).toNumber());
  });


  test("Create small BaseTx that isn't Goose Egg Tx", async () => {
    const bintools: BinTools = BinTools.getInstance();
    const networkID: number = 12345;
    // local network X Chain ID
    const blockchainID:Buffer = bintools.cb58Decode("2oALd6xoUMp3oSHMiJYVqMcbaWxGQWYosrfiT7AaFKKNG5dmKD");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("267");
    const output:SecpOutput = new SecpOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SecpInput = new SecpInput(inputAmt);
    input.addSignatureIdx(0, addrs1[0]);
    const txid:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outputIndex:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(0), 4));
    const transferableInput:TransferableInput = new TransferableInput(txid, outputIndex, avaxAssetID, input);
    ins.push(transferableInput);
    const baseTx:BaseTx = new BaseTx(networkID, blockchainID, outs, ins);
    const unsignedTx:UnsignedTx = new UnsignedTx(baseTx);
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true);
  });

  test('Create large BaseTx that is Goose Egg Tx', async () => {
    const bintools: BinTools = BinTools.getInstance();
    const networkID: number = 12345;
    // local network X Chain ID
    const blockchainID:Buffer = bintools.cb58Decode("2oALd6xoUMp3oSHMiJYVqMcbaWxGQWYosrfiT7AaFKKNG5dmKD");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("609555500000");
    const output:SecpOutput = new SecpOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("45000000000000000");
    const input:SecpInput = new SecpInput(inputAmt);
    input.addSignatureIdx(0, addrs1[0]);
    const txid:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outputIndex:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(0), 4));
    const transferableInput:TransferableInput = new TransferableInput(txid, outputIndex, avaxAssetID, input);
    ins.push(transferableInput);
    const baseTx:BaseTx = new BaseTx(networkID, blockchainID, outs, ins);
    const unsignedTx:UnsignedTx = new UnsignedTx(baseTx);
    expect(await api.checkGooseEgg(unsignedTx)).toBe(false);
  });

  test("Create large BaseTx that isn't Goose Egg Tx", async () => {
    const bintools: BinTools = BinTools.getInstance();
    const networkID: number = 12345;
    // local network X Chain ID
    const blockchainID:Buffer = bintools.cb58Decode("2oALd6xoUMp3oSHMiJYVqMcbaWxGQWYosrfiT7AaFKKNG5dmKD");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("44995609555500000");
    const output:SecpOutput = new SecpOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("45000000000000000");
    const input:SecpInput = new SecpInput(inputAmt);
    input.addSignatureIdx(0, addrs1[0]);
    const txid:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outputIndex:Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(0), 4));
    const transferableInput:TransferableInput = new TransferableInput(txid, outputIndex, avaxAssetID, input);
    ins.push(transferableInput);
    const baseTx:BaseTx = new BaseTx(networkID, blockchainID, outs, ins);
    const unsignedTx:UnsignedTx = new UnsignedTx(baseTx);
    expect(await api.checkGooseEgg(unsignedTx)).toBe(true);
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
    const secpbase1:SecpOutput = new SecpOutput(new BN(777), addrs3, locktime, 1);
    const secpbase2:SecpOutput = new SecpOutput(new BN(888), addrs2, locktime, 1);
    const secpbase3:SecpOutput = new SecpOutput(new BN(999), addrs2, locktime, 1);
    const initialState:InitialStates = new InitialStates();
    initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
    initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
    initialState.addOutput(secpbase3, AVMConstants.SECPFXID);
    const name:string = 'Rickcoin is the most intelligent coin';
    const symbol:string = 'RICK';
    const denomination:number = 9;
    const txu:CreateAssetTx = new CreateAssetTx(netid, blockchainID, outputs, inputs, new UTF8Payload("hello world").getPayload(), name, symbol, denomination, initialState);
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
      netid, blockchainID, outputs, inputs, new UTF8Payload("hello world").getPayload(), ops,
    );
    const txunew:OperationTx = new OperationTx();
    const opbuff:Buffer = optx.toBuffer();
    txunew.fromBuffer(opbuff);
    expect(txunew.toBuffer().toString('hex')).toBe(opbuff.toString('hex'));
    expect(txunew.toString()).toBe(optx.toString());
    expect(optx.getOperations().length).toBe(ops.length);
  });

  test('Creation ImportTx', () => {
    const importtx:ImportTx = new ImportTx(
      netid, blockchainID, outputs, inputs, new UTF8Payload("hello world").getPayload(), importIns
    );
    const txunew:ImportTx = new ImportTx();
    const importbuff:Buffer = importtx.toBuffer();
    txunew.fromBuffer(importbuff);

    expect(txunew.toBuffer().toString('hex')).toBe(importbuff.toString('hex'));
    expect(txunew.toString()).toBe(importtx.toString());
    expect(importtx.getImportInputs().length).toBe(importIns.length);
  });

  test('Creation ExportTx', () => {
    const exporttx:ExportTx = new ExportTx(
      netid, blockchainID, outputs, inputs, undefined, exportOuts
    );
    const txunew:ExportTx = new ExportTx();
    const exportbuff:Buffer = exporttx.toBuffer();
    txunew.fromBuffer(exportbuff);

    expect(txunew.toBuffer().toString('hex')).toBe(exportbuff.toString('hex'));
    expect(txunew.toString()).toBe(exporttx.toString());
    expect(exporttx.getExportOutputs().length).toBe(exportOuts.length);
  });

  test('Creation Tx1 with asof, locktime, threshold', () => {
    const txu:UnsignedTx = set.buildBaseTx(
      netid, blockchainID,
      new BN(9000), addrs3, addrs1, addrs1, assetID, undefined,
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
      addrs3, addrs1, addrs1, assetID, undefined
    );
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });

  test('Creation Tx3 using OperationTx', () => {
    const txu:UnsignedTx = set.buildNFTTransferTx(
      netid, blockchainID, avaxAssetID, new BN(90),
      addrs1, addrs3, addrs1, nftutxoids, undefined,
      UnixNow(), UnixNow().add(new BN(50)), 1,
    );
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
  });

  test('Creation Tx4 using ImportTx', () => {
    const txu:UnsignedTx = set.buildImportTx(
      netid, blockchainID, avaxAssetID, new BN(90), 
      addrs1, importIns,
      new UTF8Payload("hello world").getPayload(), UnixNow());
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
  });

  test('Creation Tx5 using ExportTx', () => {
    const txu:UnsignedTx = set.buildExportTx(
      netid, blockchainID, avaxAssetID, new BN(90), 
      addrs1, exportUTXOIDS, new UTF8Payload("hello world").getPayload(), UnixNow()
    )
    const tx:Tx = keymgr1.signTx(txu);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx.toBuffer().toString('hex')).toBe(tx2.toBuffer().toString('hex'));
  });

});
