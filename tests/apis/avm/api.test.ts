import mockAxios from 'jest-mock-axios';
import { Avalanche } from 'src';
import AVMAPI, { PersistanceOptions } from 'src/apis/avm/api';
import { AVMKeyPair, AVMKeyChain } from 'src/apis/avm/keychain';
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from 'src/utils/bintools';
import { UTXOSet, UTXO } from 'src/apis/avm/utxos';
import { TransferableInput, SecpInput } from 'src/apis/avm/inputs';
import createHash from 'create-hash';
import { UnsignedTx, Tx } from 'src/apis/avm/tx';
import { UnixNow, AVMConstants, InitialStates } from 'src/apis/avm/types';
import { TransferableOutput, SecpOutput } from 'src/apis/avm/outputs';
import { NFTTransferOutput } from '../../../src/apis/avm/outputs';
import { NFTTransferOperation, TransferableOperation } from '../../../src/apis/avm/ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('AVMAPI', () => {
  const networkid:number = 12345;
  const blockchainid:string = '4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH';
  const ip:string = '127.0.0.1';
  const port:number = 9650;
  const protocol:string = 'https';

  const username:string = 'AvaLabs';
  const password:string = 'password';

  const avalanche:Avalanche = new Avalanche(ip, port, protocol, networkid, undefined, true);
  let api:AVMAPI;
  let alias:string;

  const addrA:string = 'X-B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW';
  const addrB:string = 'X-P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF';
  const addrC:string = 'X-6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV';

  beforeAll(() => {
    api = new AVMAPI(avalanche, '/ext/bc/avm', blockchainid);
    alias = api.getBlockchainAlias();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('can Send 1', async () => {
    const txId = 'asdfhvl234';

    const result:Promise<string> = api.send(username, password, 'assetId', 10, addrA, [addrB]);
    const payload:object = {
      result: {
        txID: txId,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txId);
  });

  test('can Send 2', async () => {
    const txId = 'asdfhvl234';

    const result:Promise<string> = api.send(username, password, bintools.b58ToBuffer('6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF'), new BN(10), addrA, [addrB]);
    const payload:object = {
      result: {
        txID: txId,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txId);
  });

  test('listAddresses', async () => {
    const addresses = [addrA, addrB];

    const result:Promise<Array<string>> = api.listAddresses(username, password);
    const payload:object = {
      result: {
        addresses,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(addresses);
  });

  test('importKey', async () => {
    const address = addrC;

    const result:Promise<string> = api.importKey(username, password, 'key');
    const payload:object = {
      result: {
        address,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(address);
  });

  test('getBalance', async () => {
    const balance = new BN('100', 10);

    const result:Promise<BN> = api.getBalance(addrA, 'ATH');
    const payload:object = {
      result: {
        balance,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:BN = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(balance);
  });

  test('exportKey', async () => {
    const key = 'sdfglvlj2h3v45';

    const result:Promise<string> = api.exportKey(username, password, addrA);
    const payload:object = {
      result: {
        privateKey: key,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(key);
  });

  test('exportAVA', async () => {
    const amount = new BN(100);
    const to = 'abcdef';
    const username = 'Robert';
    const password = 'Paulson';
    const txID = 'valid';
    const result:Promise<string> = api.exportAVA(username, password, to, amount);
    const payload:object = {
      result: {
        txID,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test('importAVA', async () => {
    const to = 'abcdef';
    const username = 'Robert';
    const password = 'Paulson';
    const txID = 'valid';
    const result:Promise<string> = api.importAVA(username, password, to);
    const payload:object = {
      result: {
        txID,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test('createAddress', async () => {
    const alias = 'randomalias';

    const result:Promise<string> = api.createAddress(username, password);
    const payload:object = {
      result: {
        address: alias,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(alias);
  });

  test('createFixedCapAsset', async () => {
    const kp:AVMKeyPair = new AVMKeyPair(alias);
    kp.importKey(Buffer.from('ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676', 'hex'));

    const denomination:number = 0;
    const assetid:string = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
    const initialHolders:Array<object> = [
      {
        address: '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh',
        amount: '10000',
      },
      {
        address: '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh',
        amount: '50000',
      },
    ];

    const result:Promise<string> = api.createFixedCapAsset(username, password, 'Some Coin', 'SCC', denomination, initialHolders);
    const payload:object = {
      result: {
        assetID: assetid,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(assetid);
  });

  test('createVariableCapAsset', async () => {
    const kp:AVMKeyPair = new AVMKeyPair(alias);
    kp.importKey(Buffer.from('ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676', 'hex'));

    const denomination:number = 0;
    const assetid:string = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
    const minterSets:Array<object> = [
      {
        minters: [
          '4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q',
        ],
        threshold: 1,
      },
      {
        minters: [
          'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
          '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
          '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
        ],
        threshold: 2,
      },
    ];

    const result:Promise<string> = api.createVariableCapAsset(username, password, 'Some Coin', 'SCC', denomination, minterSets);
    const payload:object = {
      result: {
        assetID: assetid,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(assetid);
  });

  test('createMintTx 1', async () => {
    const amount:number = 2;
    const assetID:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
    const to:string = 'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF';
    const minters:Array<string> = [
      'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
      '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
      '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
    ];
    const result:Promise<string> = api.createMintTx(amount, assetID, to, minters);
    const payload:object = {
      result: {
        tx: 'sometx',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('sometx');
  });

  test('createMintTx 2', async () => {
    const amount:BN = new BN(1);
    const assetID:Buffer = Buffer.from('f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7', 'hex');
    const to:string = 'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF';
    const minters:Array<string> = [
      'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
      '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
      '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
    ];
    const result:Promise<string> = api.createMintTx(amount, assetID, to, minters);
    const payload:object = {
      result: {
        tx: 'sometx',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('sometx');
  });

  test('signMintTx 1', async () => {
    const username:string = 'Collin';
    const password:string = 'Cusce';
    const tx:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
    const minter:string = addrA;
    const result:Promise<string> = api.signMintTx(username, password, tx, minter);
    const payload:object = {
      result: {
        tx: 'sometx',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('sometx');
  });

  test('signMintTx 2', async () => {
    const username:string = 'Collin';
    const password:string = 'Cusce';
    const tx:Buffer = Buffer.from('f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7', 'hex');
    const minter:string = addrA;
    const result:Promise<string> = api.signMintTx(username, password, tx, minter);
    const payload:object = {
      result: {
        tx: 'sometx',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('sometx');
  });

  test('getTxStatus', async () => {
    const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';

    const result:Promise<string> = api.getTxStatus(txid);
    const payload:object = {
      result: {
        status: 'accepted',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('accepted');
  });

  test('getAssetDescription as string', async () => {
    const assetid:Buffer = Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex');
    const assetidstr:string = bintools.avaSerialize(assetid);

    const result:Promise<object> = api.getAssetDescription(assetidstr);
    const payload:object = {
      result: {
        name: 'Collin Coin',
        symbol: 'CKC',
        assetID: assetidstr,
        denomination: '10',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:any = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.name).toBe('Collin Coin');
    expect(response.symbol).toBe('CKC');
    expect(response.assetID.toString('hex')).toBe(assetid.toString('hex'));
    expect(response.denomination).toBe(10);
  });

  test('getAssetDescription as Buffer', async () => {
    const assetid:Buffer = Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex');
    const assetidstr:string = bintools.avaSerialize(Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex'));

    const result:Promise<object> = api.getAssetDescription(assetid);
    const payload:object = {
      result: {
        name: 'Collin Coin',
        symbol: 'CKC',
        assetID: assetidstr,
        denomination: '11',
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:any = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.name).toBe('Collin Coin');
    expect(response.symbol).toBe('CKC');
    expect(response.assetID.toString('hex')).toBe(assetid.toString('hex'));
    expect(response.denomination).toBe(11);
  });

  test('getUTXOs', async () => {
    // Payment
    const OPUTXOstr1:string = bintools.avaSerialize(Buffer.from('38d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d', 'hex'));
    const OPUTXOstr2:string = bintools.avaSerialize(Buffer.from('c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));
    const OPUTXOstr3:string = bintools.avaSerialize(Buffer.from('f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));

    const set:UTXOSet = new UTXOSet();
    set.add(OPUTXOstr1);
    set.addArray([OPUTXOstr2, OPUTXOstr3]);

    const persistOpts:PersistanceOptions = new PersistanceOptions('test', true, 'union');
    expect(persistOpts.getMergeRule()).toBe('union');
    let addresses:Array<string> = set.getAddresses().map((a) => api.addressFromBuffer(a));
    let result:Promise<UTXOSet> = api.getUTXOs(addresses, persistOpts);
    const payload:object = {
      result: {
        utxos: [OPUTXOstr1, OPUTXOstr2, OPUTXOstr3],
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    let response:UTXOSet = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));

    addresses = set.getAddresses().map((a) => api.addressFromBuffer(a));
    result = api.getUTXOs(addresses, persistOpts);

    mockAxios.mockResponse(responseObj);
    response = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));
  });

  describe('Transactions', () => {
    let set:UTXOSet;
    let keymgr2:AVMKeyChain;
    let keymgr3:AVMKeyChain;
    let addrs1:Array<string>;
    let addrs2:Array<string>;
    let addrs3:Array<string>;
    let addressbuffs:Array<Buffer> = [];
    let addresses:Array<string> = [];
    let utxos:Array<UTXO>;
    let inputs:Array<TransferableInput>;
    let outputs:Array<TransferableOutput>;
    let ops:Array<TransferableOperation>;
    const amnt:number = 10000;
    const assetID:Buffer = Buffer.from(createHash('sha256').update('mary had a little lamb').digest());
    const NFTassetID:Buffer = Buffer.from(createHash('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    let secpbase1:SecpOutput;
    let secpbase2:SecpOutput;
    let secpbase3:SecpOutput;
    let initialState:InitialStates;
    const nftutxoids:Array<string> = [];

    beforeEach(() => {
      set = new UTXOSet();
      api.newKeyChain();
      keymgr2 = new AVMKeyChain(alias);
      keymgr3 = new AVMKeyChain(alias);
      addrs1 = [];
      addrs2 = [];
      addrs3 = [];
      utxos = [];
      inputs = [];
      outputs = [];
      ops = [];
      const pload:Buffer = Buffer.alloc(1024);
      pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');

      for (let i:number = 0; i < 3; i++) {
        addrs1.push(api.addressFromBuffer(api.keyChain().makeKey()));
        addrs2.push(api.addressFromBuffer(keymgr2.makeKey()));
        addrs3.push(api.addressFromBuffer(keymgr3.makeKey()));
      }
      const amount:BN = new BN(amnt);
      addressbuffs = api.keyChain().getAddresses();
      addresses = addressbuffs.map((a) => api.addressFromBuffer(a));
      const fallAddresses:Array<string> = keymgr2.getAddresses().map((a) => api.addressFromBuffer(a));
      const locktime:BN = new BN(54321);
      const fallLocktime:BN = locktime.add(new BN(50));
      const threshold:number = 3;
      const fallThreshold:number = 1;

      for (let i:number = 0; i < 5; i++) {
        let txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
        let txidx:Buffer = Buffer.alloc(4);
        txidx.writeUInt32BE(i, 0);
        const out:SecpOutput = new SecpOutput(amount, locktime, threshold, addressbuffs);
        const xferout:TransferableOutput = new TransferableOutput(assetID, out);
        outputs.push(xferout);

        const u:UTXO = new UTXO();
        u.fromBuffer(Buffer.concat([txid, txidx, xferout.toBuffer()]));
        utxos.push(u);

        txid = u.getTxID();
        txidx = u.getOutputIdx();
        const asset = u.getAssetID();

        const input:SecpInput = new SecpInput(amount);
        const xferinput:TransferableInput = new TransferableInput(txid, txidx, asset, input);
        inputs.push(xferinput);

        const nout:NFTTransferOutput = new NFTTransferOutput(1000 + i, pload, locktime, threshold, addressbuffs);
        const op:NFTTransferOperation = new NFTTransferOperation(nout);
        const nfttxid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(1000 + i), 32)).digest());
        const nftutxo:UTXO = new UTXO(nfttxid, 1000 + i, NFTassetID, nout);
        nftutxoids.push(nftutxo.getUTXOID());
        const xferop:TransferableOperation = new TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
        ops.push(xferop);
        utxos.push(nftutxo);
      }
      set.addArray(utxos);

      secpbase1 = new SecpOutput(new BN(777), UnixNow(), 1, addrs3.map((a) => api.parseAddress(a)));
      secpbase2 = new SecpOutput(new BN(888), UnixNow(), 1, addrs2.map((a) => api.parseAddress(a)));
      secpbase3 = new SecpOutput(new BN(999), UnixNow(), 1, addrs2.map((a) => api.parseAddress(a)));
      initialState = new InitialStates();
      initialState.addOutput(secpbase1, AVMConstants.SECPFXID);
      initialState.addOutput(secpbase2, AVMConstants.SECPFXID);
      initialState.addOutput(secpbase3, AVMConstants.SECPFXID);
    });

    test('buildBaseTx1', async () => {
      const txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.avaDeserialize(blockchainid), new BN(amnt),
        addrs3.map((a) => api.parseAddress(a)),
        addrs1.map((a) => api.parseAddress(a)),
        addrs1.map((a) => api.parseAddress(a)),
        assetID, UnixNow(), new BN(0), 1,
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());
    });

    test('buildBaseTx2', async () => {
      const txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt).sub(new BN(100)), addrs3, addrs1, addrs2, bintools.avaSerialize(assetID));
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.avaDeserialize(blockchainid), new BN(amnt).sub(new BN(100)),
        addrs3.map((a) => api.parseAddress(a)),
        addrs1.map((a) => api.parseAddress(a)),
        addrs2.map((a) => api.parseAddress(a)),
        assetID, UnixNow(), new BN(0), 1,
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      const outies = txu1.getTransaction().getOuts().sort(TransferableOutput.comparator()) as Array<TransferableOutput>;

      expect(outies.length).toBe(2);
      const outaddr0 = outies[0].getOutput().getAddresses().map((a) => api.addressFromBuffer(a));
      const outaddr1 = outies[1].getOutput().getAddresses().map((a) => api.addressFromBuffer(a));

      const testaddr2 = JSON.stringify(addrs2.sort());
      const testaddr3 = JSON.stringify(addrs3.sort());

      const testout0 = JSON.stringify(outaddr0.sort());
      const testout1 = JSON.stringify(outaddr1.sort());
      expect(
        (testaddr2 == testout0 && testaddr3 == testout1)
                || (testaddr3 == testout0 && testaddr2 == testout1),
      ).toBe(true);
    });

    test('signTx', async () => {
      const txu1:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.avaDeserialize(blockchainid), new BN(amnt),
        addrs3.map((a) => api.parseAddress(a)),
        addrs1.map((a) => api.parseAddress(a)),
        addrs1.map((a) => api.parseAddress(a)),
        assetID, UnixNow(), new BN(0), 1,
      );

      const tx1:Tx = api.signTx(txu1);
      const tx2:Tx = api.signTx(txu2);

      expect(tx2.toBuffer().toString('hex')).toBe(tx1.toBuffer().toString('hex'));
      expect(tx2.toString()).toBe(tx1.toString());
    });

    test('issueTx Serialized', async () => {
      const txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
      const tx = api.signTx(txu);

      const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';

      const result:Promise<string> = api.issueTx(tx.toString());
      const payload:object = {
        result: {
          txID: txid,
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const response:string = await result;

      expect(mockAxios.request).toHaveBeenCalledTimes(1);
      expect(response).toBe(txid);
    });

    test('issueTx Buffer', async () => {
      const txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
      const tx = api.signTx(txu);

      const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
      const result:Promise<string> = api.issueTx(tx.toBuffer());
      const payload:object = {
        result: {
          txID: txid,
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const response:string = await result;

      expect(mockAxios.request).toHaveBeenCalledTimes(1);
      expect(response).toBe(txid);
    });

    test('issueTx Class Tx', async () => {
      const txu:UnsignedTx = await api.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, bintools.avaSerialize(assetID));
      const tx = api.signTx(txu);

      const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';

      const result:Promise<string> = api.issueTx(tx);
      const payload:object = {
        result: {
          txID: txid,
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const response:string = await result;

      expect(mockAxios.request).toHaveBeenCalledTimes(1);
      expect(response).toBe(txid);
    });

    test('buildCreateAssetTx', async () => {
      const fee:number = 10;
      const name:string = 'Mortycoin is the dumb as a sack of hammers.';
      const symbol:string = 'morT';
      const denomination:number = 8;

      const result:Promise<UnsignedTx> = api.buildCreateAssetTx(set, new BN(fee), addrs1, initialState, name, symbol, denomination);
      const payload:object = {
        result: {
          name,
          symbol,
          assetID: bintools.avaSerialize(assetID),
          denomination: `${denomination}`,
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const txu1:UnsignedTx = await result;

      expect(mockAxios.request).toHaveBeenCalledTimes(1);

      const txu2:UnsignedTx = set.buildCreateAssetTx(avalanche.getNetworkID(), bintools.avaDeserialize(api.getBlockchainID()), assetID, new BN(fee), addrs1.map((a) => api.parseAddress(a)), initialState, name, symbol, denomination);

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());
    });

    test('buildNFTTransferTx', async () => {
      const pload:Buffer = Buffer.alloc(1024);
      pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
      const addrbuff1 = addrs1.map((a) => api.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => api.parseAddress(a));
      const fee:BN = new BN(90);
      const txu1:UnsignedTx = await api.buildNFTTransferTx(
        set, nftutxoids[1], addrs3, addrs3, fee, addrs1,
        UnixNow(), new BN(0), 1,
      );

      const txu2:UnsignedTx = set.buildNFTTransferTx(
        networkid, bintools.avaDeserialize(blockchainid), assetID,
        fee, addrbuff1, addrbuff3, addrbuff3,
        [nftutxoids[1]], UnixNow(), new BN(0), 1,
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());
    });
  });

  test('buildGenesis', async () => {
    const genesisData:object = {
      genesisData: {
        assetAlias1: {
          name: 'human readable name',
          symbol: 'AVAL',
          initialState: {
            fixedCap: [
              {
                amount: 1000,
                address: 'A',
              },
              {
                amount: 5000,
                address: 'B',
              },
            ],
          },
        },
        assetAliasCanBeAnythingUnique: {
          name: 'human readable name',
          symbol: 'AVAL',
          initialState: {
            variableCap: [
              {
                minters: [
                  'A',
                  'B',
                ],
                threshold: 1,
              },
              {
                minters: [
                  'A',
                  'B',
                  'C',
                ],
                threshold: 2,
              },
            ],
          },
        },
      },
    };
    const bytes:string = '111TNWzUtHKoSvxohjyfEwE2X228ZDGBngZ4mdMUVMnVnjtnawW1b1zbAhzyAM1v6d7ECNj6DXsT7qDmhSEf3DWgXRj7ECwBX36ZXFc9tWVB2qHURoUfdDvFsBeSRqatCmj76eZQMGZDgBFRNijRhPNKUap7bCeKpHDtuCZc4YpPkd4mR84dLL2AL1b4K46eirWKMaFVjA5btYS4DnyUx5cLpAq3d35kEdNdU5zH3rTU18S4TxYV8voMPcLCTZ3h4zRsM5jW1cUzjWVvKg7uYS2oR9qXRFcgy1gwNTFZGstySuvSF7MZeZF4zSdNgC4rbY9H94RVhqe8rW7MXqMSZB6vBTB2BpgF6tNFehmYxEXwjaKRrimX91utvZe9YjgGbDr8XHsXCnXXg4ZDCjapCy4HmmRUtUoAduGNBdGVMiwE9WvVbpMFFcNfgDXGz9NiatgSnkxQALTHvGXXm8bn4CoLFzKnAtq3KwiWqHmV3GjFYeUm3m8Zee9VDfZAvDsha51acxfto1htstxYu66DWpT36YT18WSbxibZcKXa7gZrrsCwyzid8CCWw79DbaLCUiq9u47VqofG1kgxwuuyHb8NVnTgRTkQASSbj232fyG7YeX4mAvZY7a7K7yfSyzJaXdUdR7aLeCdLP6mbFDqUMrN6YEkU2X8d4Ck3T';

    const result:Promise<string> = api.buildGenesis(genesisData);
    const payload:object = {
      result: {
        bytes,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(bytes);
  });
});
