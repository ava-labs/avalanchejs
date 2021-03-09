import mockAxios from 'jest-mock-axios';
import { UTXOSet, UTXO } from 'src/apis/platformvm/utxos';
import { PlatformVMAPI } from 'src/apis/platformvm/api';
import { UnsignedTx, Tx } from 'src/apis/platformvm/tx';
import { KeyChain } from 'src/apis/platformvm/keychain';
import { SECPTransferInput, TransferableInput } from 'src/apis/platformvm/inputs';
import createHash from 'create-hash';
import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import { SECPTransferOutput, TransferableOutput } from 'src/apis/platformvm/outputs';
import { PlatformVMConstants } from 'src/apis/platformvm/constants';
import { Avalanche } from 'src/index';
import { UTF8Payload } from 'src/utils/payload';
import { UnixNow } from 'src/utils/helperfunctions';
import { BaseTx } from 'src/apis/platformvm/basetx';
import { ImportTx } from 'src/apis/platformvm/importtx';
import { ExportTx } from 'src/apis/platformvm/exporttx';
import { PlatformChainID } from 'src/utils/constants';


/**
 * @ignore
 */
const bintools = BinTools.getInstance();
describe('Transactions', () => {
  let set:UTXOSet;
  let keymgr1:KeyChain;
  let keymgr2:KeyChain;
  let keymgr3:KeyChain;
  let addrs1:Array<Buffer>;
  let addrs2:Array<Buffer>;
  let addrs3:Array<Buffer>;
  let utxos:Array<UTXO>;
  let inputs:Array<TransferableInput>;
  let outputs:Array<TransferableOutput>;
  let importIns:Array<TransferableInput>;
  let importUTXOs:Array<UTXO>;
  let exportOuts:Array<TransferableOutput>;
  let fungutxos:Array<UTXO>;
  let exportUTXOIDS:Array<string>;
  let api:PlatformVMAPI;
  const amnt:number = 10000;
  const netid:number = 12345;
  const memo:Buffer = Buffer.from("AvalancheJS");
  const blockchainID:Buffer = bintools.cb58Decode(PlatformChainID);
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
  const blockchainid:string = PlatformChainID;
  const name:string = 'Mortycoin is the dumb as a sack of hammers.';
  const symbol:string = 'morT';
  const denomination:number = 8;
  let avaxAssetID:Buffer;

  beforeAll(async () => {
    
    avalanche = new Avalanche(ip, port, protocol, 12345, undefined, undefined, null, true);
    api = new PlatformVMAPI(avalanche, '/ext/bc/P');

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
    keymgr1 = new KeyChain(avalanche.getHRP(), alias);
    keymgr2 = new KeyChain(avalanche.getHRP(), alias);
    keymgr3 = new KeyChain(avalanche.getHRP(), alias);
    addrs1 = [];
    addrs2 = [];
    addrs3 = [];
    utxos = [];
    inputs = [];
    outputs = [];
    importIns = [];
    importUTXOs = []
    exportOuts = [];
    fungutxos = [];
    exportUTXOIDS = [];
    for (let i:number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey().getAddress());
      addrs2.push(keymgr2.makeKey().getAddress());
      addrs3.push(keymgr3.makeKey().getAddress());
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
      const out:SECPTransferOutput = new SECPTransferOutput(amount, addresses, locktime, threshold);
      const xferout:TransferableOutput = new TransferableOutput(assetID, out);
      outputs.push(xferout);

      const u:UTXO = new UTXO(PlatformVMConstants.LATESTCODEC, txid, txidx, assetID, out);
      utxos.push(u);
      fungutxos.push(u);
      importUTXOs.push(u);

      txid = u.getTxID();
      txidx = u.getOutputIdx();

      const input:SECPTransferInput = new SECPTransferInput(amount);
      const xferin:TransferableInput = new TransferableInput(txid, txidx, assetID, input);
      inputs.push(xferin);
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
    
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("266");
    const output:SECPTransferOutput = new SECPTransferOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SECPTransferInput = new SECPTransferInput(inputAmt);
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
    // local network P Chain ID
    // AVAX assetID
    const assetID:Buffer = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("266");
    const output:SECPTransferOutput = new SECPTransferOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(assetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SECPTransferInput = new SECPTransferInput(inputAmt);
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
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("267");
    const output:SECPTransferOutput = new SECPTransferOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("400");
    const input:SECPTransferInput = new SECPTransferInput(inputAmt);
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
    // local network P Chain ID
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("609555500000");
    const output:SECPTransferOutput = new SECPTransferOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("45000000000000000");
    const input:SECPTransferInput = new SECPTransferInput(inputAmt);
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
    // local network P Chain ID
    const outs:TransferableOutput[] = [];
    const ins:TransferableInput[] = [];
    const outputAmt:BN = new BN("44995609555500000");
    const output:SECPTransferOutput = new SECPTransferOutput(outputAmt, addrs1, new BN(0), 1);
    const transferableOutput:TransferableOutput = new TransferableOutput(avaxAssetID, output);
    outs.push(transferableOutput);
    const inputAmt:BN = new BN("45000000000000000");
    const input:SECPTransferInput = new SECPTransferInput(inputAmt);
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
        new BN(amnt * 1000), assetID,
        addrs3, addrs1, addrs1, 
      );
    }).toThrow();
  });

  test('Creation ImportTx', () => {
    const bombtx:ImportTx = new ImportTx(
      netid, blockchainID, outputs, inputs, new UTF8Payload("hello world").getPayload(), undefined, importIns
    );

    expect(() => {
      bombtx.toBuffer();
    }).toThrow();

    const importtx:ImportTx = new ImportTx(
      netid, blockchainID,  outputs, inputs, new UTF8Payload("hello world").getPayload(), bintools.cb58Decode(PlatformChainID), importIns
    );
    const txunew:ImportTx = new ImportTx();
    const importbuff:Buffer = importtx.toBuffer();
    txunew.fromBuffer(importbuff);

    expect(txunew.toBuffer().toString('hex')).toBe(importbuff.toString('hex'));
    expect(txunew.toString()).toBe(importtx.toString());
    expect(importtx.getImportInputs().length).toBe(importIns.length);
  });

  test('Creation ExportTx', () => {
    const bombtx:ExportTx = new ExportTx(
      netid, blockchainID, outputs, inputs, undefined, undefined, exportOuts
    );

    expect(() => {
      bombtx.toBuffer();
    }).toThrow();

    const exporttx:ExportTx = new ExportTx(
      netid, blockchainID, outputs, inputs, undefined, bintools.cb58Decode(PlatformChainID), exportOuts
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
      new BN(9000), assetID, addrs3, addrs1, addrs1, undefined, undefined, undefined,
      UnixNow(), UnixNow().add(new BN(50)), 1,
    );
    const tx:Tx = txu.sign(keymgr1);

    const tx2:Tx = new Tx();
    tx2.fromString(tx.toString());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });
  test('Creation Tx2 without asof, locktime, threshold', () => {
    const txu:UnsignedTx = set.buildBaseTx(
      netid, blockchainID,
      new BN(9000), assetID,
      addrs3, addrs1, addrs1
    );
    const tx:Tx = txu.sign(keymgr1);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    expect(tx2.toString()).toBe(tx.toString());
  });

  test('Creation Tx4 using ImportTx', () => {
    const txu:UnsignedTx = set.buildImportTx(
      netid, blockchainID, addrs3, addrs1, addrs2, importUTXOs, bintools.cb58Decode(PlatformChainID), new BN(90), assetID,
      new UTF8Payload("hello world").getPayload(), UnixNow());
    const tx:Tx = txu.sign(keymgr1);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
  });

  test('Creation Tx5 using ExportTx', () => {
    const txu:UnsignedTx = set.buildExportTx(
      netid, blockchainID, new BN(90), avaxAssetID,
      addrs3, addrs1, addrs2, bintools.cb58Decode(PlatformChainID), 
      undefined, undefined, new UTF8Payload("hello world").getPayload(), UnixNow()
    )
    const tx:Tx = txu.sign(keymgr1);
    const tx2:Tx = new Tx();
    tx2.fromBuffer(tx.toBuffer());
    expect(tx.toBuffer().toString('hex')).toBe(tx2.toBuffer().toString('hex'));
  });

});
