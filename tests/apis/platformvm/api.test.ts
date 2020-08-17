import mockAxios from 'jest-mock-axios';

import { Avalanche } from 'src';
import { PlatformVMAPI } from 'src/apis/platformvm/api';
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from 'src/utils/bintools';
import * as bech32 from 'bech32';
import { Defaults, PlatformChainID } from 'src/utils/constants';
import { UTXOSet } from 'src/apis/platformvm/utxos';
import { PersistanceOptions } from 'src/utils/persistenceoptions';
import { PlatformVMKeyChain } from 'src/apis/platformvm/keychain';
import { SecpOutput, TransferableOutput } from 'src/apis/platformvm/outputs';
import { TransferableInput, SecpInput } from 'src/apis/platformvm/inputs';
import { UTXO } from 'src/apis/platformvm/utxos';
import createHash from 'create-hash';
import { UnsignedTx, Tx } from 'src/apis/platformvm/tx';
import { UnixNow } from 'src/utils/helperfunctions';
import { UTF8Payload } from 'src/utils/payload';
import { ImportTx } from 'src/apis/platformvm/importtx';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('PlatformVMAPI', () => {
  const networkid:number = 12345;
  const blockchainid:string = PlatformChainID;
  const ip:string = '127.0.0.1';
  const port:number = 9650;
  const protocol:string = 'https';

  const username:string = 'AvaLabs';
  const password:string = 'password';

  const avalanche:Avalanche = new Avalanche(ip, port, protocol, networkid, undefined, undefined, true);
  let api:PlatformVMAPI;
  let alias:string;

  const addrA:string = 'P-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")));
  const addrB:string = 'P-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")));
  const addrC:string = 'P-' + bech32.encode(avalanche.getHRP(), bech32.toWords(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")));

  beforeAll(() => {
    api = new PlatformVMAPI(avalanche, '/ext/bc/P');
    alias = api.getBlockchainAlias();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('refreshBlockchainID', async () => {
    let n3bcID:string = Defaults.network[3].P["blockchainID"];
    let testAPI:PlatformVMAPI = new PlatformVMAPI(avalanche, '/ext/bc/P');
    let bc1:string = testAPI.getBlockchainID();
    expect(bc1).toBe(PlatformChainID);

    testAPI.refreshBlockchainID();
    let bc2:string = testAPI.getBlockchainID();
    expect(bc2).toBe(PlatformChainID);

    testAPI.refreshBlockchainID(n3bcID);
    let bc3:string = testAPI.getBlockchainID();
    expect(bc3).toBe(n3bcID);

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
    const respobj = {
      balance,
      utxoIDs: [
        {
          "txID":"LUriB3W919F84LwPMMw4sm2fZ4Y76Wgb6msaauEY7i1tFNmtv",
        "outputIndex":0
        }
      ]
    }
    const result:Promise<object> = api.getBalance(addrA);
    const payload:object = {
      result: respobj,
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj));
  });

  test('addNonDefaultSubnetValidator 1', async () => {
    const id = 'abcdef';
    let subnetID = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = api.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('addDefaultSubnetValidator 1', async () => {
    const id = 'abcdef';
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const stakeAmount = new BN(13);
    const payerNonce = 3;
    const destination = 'fedcba';
    const delegationFeeRate = new BN(2);
    const utx = 'valid';
    const result:Promise<string> = api.addDefaultSubnetValidator(id, startTime, endTime, stakeAmount, payerNonce, destination, delegationFeeRate);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('addNonDefaultSubnetValidator 2', async () => {
    const id = 'abcdef';
    const subnetID = 'abcdef';
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = api.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('addNonDefaultSubnetValidator 3', async () => {
    const id = 'abcdef';
    const subnetID = Buffer.from('abcdef', 'hex');
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = api.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('addDefaultSubnetDelegator 1', async () => {
    const id = 'abcdef';
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const stakeAmount = new BN(13);
    const payerNonce = 3;
    const destination = 'fedcba';
    const utx = 'valid';
    const result:Promise<string> = api.addDefaultSubnetDelegator(id, startTime, endTime, stakeAmount, payerNonce, destination);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('getBlockchains 1', async () => {
    const resp = [{
      id: 'nodeID',
      subnetID: 'subnetID',
      vmID: 'vmID',
    }];
    const result:Promise<Array<object>> = api.getBlockchains();
    const payload:object = {
      result: {
        blockchains: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<object> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resp);
  });

  test('getSubnets 1', async () => {
    const resp: Array<object> = [{
      id: 'id',
      controlKeys: ['controlKeys'],
      threshold: 'threshold',
    }];
    const result:Promise<object> = api.getSubnets();
    const payload:object = {
      result: {
        subnets: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toEqual(resp);
  });

  test('getCurrentValidators 1', async () => {
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = api.getCurrentValidators();
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<object> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(validators);
  });

  test('getCurrentValidators 2', async () => {
    const subnetID:string = 'abcdef';
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = api.getCurrentValidators(subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<object> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(validators);
  });

  test('getCurrentValidators 3', async () => {
    const subnetID:Buffer = Buffer.from('abcdef', 'hex');
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = api.getCurrentValidators(subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<object> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(validators);
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

  test("exportAVAX", async ()=>{
    let amount = new BN(100);
    let to = "abcdef";
    let username = "Robert";
    let password = "Paulson";
    let txID = "valid";
    let result:Promise<string> = api.exportAVAX(username, password, amount, to);
    let payload:object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test("importAVAX", async ()=>{
    let to = "abcdef";
    let username = "Robert";
    let password = "Paulson";
    let txID = "valid";
    let result:Promise<string> = api.importAVAX(username, password, to);
    let payload:object = {
        "result": {
            "txID": txID
        }
    };
    let responseObj = {
        data: payload
    };

    mockAxios.mockResponse(responseObj);
    let response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(txID);
  });

  test('createBlockchain 1', async () => {
    const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const vmID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const name:string = 'Some Blockchain';
    const genesis:string = '{ruh:"roh"}';
    const result:Promise<string> = api.createBlockchain(vmID, name, 1, genesis);
    const payload:object = {
      result: {
        blockchainID,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(blockchainID);
  });

  test('createBlockchain 2', async () => {
    const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const vmID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const name:string = 'Some Blockchain';
    const genesis:string = '{ruh:"roh"}';
    const subnetID:string = 'abcdefg';
    const result:Promise<string> = api.createBlockchain(vmID, name, 1, genesis, subnetID);
    const payload:object = {
      result: {
        blockchainID,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(blockchainID);
  });

  test('createBlockchain 3', async () => {
    const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const vmID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const name:string = 'Some Blockchain';
    const genesis:string = '{ruh:"roh"}';
    const subnetID:Buffer = Buffer.from('abcdef', 'hex');
    const result:Promise<string> = api.createBlockchain(vmID, name, 1, genesis, subnetID);
    const payload:object = {
      result: {
        blockchainID,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(blockchainID);
  });

  test('getBlockchainStatus', async () => {
  const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
  const result:Promise<string> = api.getBlockchainStatus(blockchainID);
  const payload:object = {
    result: {
      status: 'Accepted',
    },
  };
  const responseObj = {
    data: payload,
  };

  mockAxios.mockResponse(responseObj);
  const response:string = await result;

  expect(mockAxios.request).toHaveBeenCalledTimes(1);
  expect(response).toBe('Accepted');
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

  test('createSubnet 1', async () => {
    const controlKeys = ['abcdef'];
    const threshold = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = api.createSubnet(controlKeys, threshold, payerNonce);
    const payload:object = {
      result: {
        unsignedTx: utx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(utx);
  });

  test('sampleValidators 1', async () => {
    let subnetID;
    const validators = ['val1', 'val2'];
    const result:Promise<Array<string>> = api.sampleValidators(10, subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(validators);
  });

  test('sampleValidators 2', async () => {
    const subnetID = 'abcdef';
    const validators = ['val1', 'val2'];
    const result:Promise<Array<string>> = api.sampleValidators(10, subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(validators);
  });

  test('sampleValidators 3', async () => {
    const subnetID = Buffer.from('abcdef', 'hex');
    const validators = ['val1', 'val2'];
    const result:Promise<Array<string>> = api.sampleValidators(10, subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };
  });

  test('validatedBy 1', async () => {
    const blockchainID = 'abcdef';
    const resp = 'valid';
    const result:Promise<string> = api.validatedBy(blockchainID);
    const payload:object = {
      result: {
        subnetID: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resp);
  });

  test('validates 1', async () => {
    let subnetID;
    const resp = ['valid'];
    const result:Promise<Array<string>> = api.validates(subnetID);
    const payload:object = {
      result: {
        blockchainIDs: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resp);
  });

  test('validates 2', async () => {
    const subnetID = 'deadbeef';
    const resp = ['valid'];
    const result:Promise<Array<string>> = api.validates(subnetID);
    const payload:object = {
      result: {
        blockchainIDs: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resp);
  });

  test('validates 3', async () => {
    const subnetID = Buffer.from('abcdef', 'hex');
    const resp = ['valid'];
    const result:Promise<Array<string>> = api.validates(subnetID);
    const payload:object = {
      result: {
        blockchainIDs: resp,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:Array<string> = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resp);
  });

  test('getUTXOs', async () => {
    // Payment
    const OPUTXOstr1:string = bintools.cb58Encode(Buffer.from('000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d', 'hex'));
    const OPUTXOstr2:string = bintools.cb58Encode(Buffer.from('0000c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));
    const OPUTXOstr3:string = bintools.cb58Encode(Buffer.from('0000f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));

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
    let keymgr2:PlatformVMKeyChain;
    let keymgr3:PlatformVMKeyChain;
    let addrs1:Array<string>;
    let addrs2:Array<string>;
    let addrs3:Array<string>;
    let addressbuffs:Array<Buffer> = [];
    let addresses:Array<string> = [];
    let utxos:Array<UTXO>;
    let inputs:Array<TransferableInput>;
    let outputs:Array<TransferableOutput>;
    const amnt:number = 10000;
    const assetID:Buffer = Buffer.from(createHash('sha256').update('mary had a little lamb').digest());
    const NFTassetID:Buffer = Buffer.from(createHash('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    let secpbase1:SecpOutput;
    let secpbase2:SecpOutput;
    let secpbase3:SecpOutput;
    let fungutxoids:Array<string> = [];
    let avm:PlatformVMAPI;
    const fee:number = 10;
    const name:string = 'Mortycoin is the dumb as a sack of hammers.';
    const symbol:string = 'morT';
    const denomination:number = 8;

    beforeEach(async () => {
      avm = new PlatformVMAPI(avalanche, "/ext/bc/P");
      const result:Promise<Buffer> = avm.getAVAXAssetID();
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
      await result;
      set = new UTXOSet();
      avm.newKeyChain();
      keymgr2 = new PlatformVMKeyChain(avalanche.getHRP(), alias);
      keymgr3 = new PlatformVMKeyChain(avalanche.getHRP(), alias);
      addrs1 = [];
      addrs2 = [];
      addrs3 = [];
      utxos = [];
      inputs = [];
      outputs = [];
      fungutxoids = [];
      const pload:Buffer = Buffer.alloc(1024);
      pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');

      for (let i:number = 0; i < 3; i++) {
        addrs1.push(avm.addressFromBuffer(avm.keyChain().makeKey()));
        addrs2.push(avm.addressFromBuffer(keymgr2.makeKey()));
        addrs3.push(avm.addressFromBuffer(keymgr3.makeKey()));
      }
      const amount:BN = new BN(amnt);
      addressbuffs = avm.keyChain().getAddresses();
      addresses = addressbuffs.map((a) => avm.addressFromBuffer(a));
      const locktime:BN = new BN(54321);
      const threshold:number = 3;
      for (let i:number = 0; i < 5; i++) {
        let txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
        let txidx:Buffer = Buffer.alloc(4);
        txidx.writeUInt32BE(i, 0);
        
        const out:SecpOutput = new SecpOutput(amount, addressbuffs, locktime, threshold);
        const xferout:TransferableOutput = new TransferableOutput(assetID, out);
        outputs.push(xferout);

        const u:UTXO = new UTXO();
        u.fromBuffer(Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
        fungutxoids.push(u.getUTXOID());
        utxos.push(u);

        txid = u.getTxID();
        txidx = u.getOutputIdx();
        const asset = u.getAssetID();

        const input:SecpInput = new SecpInput(amount);
        const xferinput:TransferableInput = new TransferableInput(txid, txidx, asset, input);
        inputs.push(xferinput);
      }
      set.addArray(utxos);

      secpbase1 = new SecpOutput(new BN(777), addrs3.map((a) => avm.parseAddress(a)), UnixNow(), 1);
      secpbase2 = new SecpOutput(new BN(888), addrs2.map((a) => avm.parseAddress(a)), UnixNow(), 1);
      secpbase3 = new SecpOutput(new BN(999), addrs2.map((a) => avm.parseAddress(a)), UnixNow(), 1);

    });

    test('buildBaseTx1', async () => {
      const assetID = await avm.getAVAXAssetID();
      const txu1:UnsignedTx = await avm.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1, new UTF8Payload("hello world").getContent());
      let memobuf:Buffer = Buffer.from("hello world");
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.cb58Decode(blockchainid), new BN(amnt), assetID,
        addrs3.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        avm.getFee(), assetID,
         memobuf, UnixNow(), new BN(0), 1,
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());
    });

    test('buildBaseTx2', async () => {
      const assetID = await avm.getAVAXAssetID();
      const txu1:UnsignedTx = await avm.buildBaseTx(
        set, new BN(amnt).sub(new BN(100)),
        addrs3, addrs1, addrs2, 
        new UTF8Payload("hello world"));
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.cb58Decode(blockchainid), new BN(amnt).sub(new BN(100)), assetID,
        addrs3.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs2.map((a) => avm.parseAddress(a)),
        avm.getFee(), assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow(), new BN(0), 1,
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      const outies = txu1.getTransaction().getOuts().sort(TransferableOutput.comparator()) as Array<TransferableOutput>;

      expect(outies.length).toBe(2);
      const outaddr0 = outies[0].getOutput().getAddresses().map((a) => avm.addressFromBuffer(a));
      const outaddr1 = outies[1].getOutput().getAddresses().map((a) => avm.addressFromBuffer(a));

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
      const assetID = await avm.getAVAXAssetID();
      const txu1:UnsignedTx = await avm.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1);
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.cb58Decode(blockchainid), new BN(amnt), assetID,
        addrs3.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        avm.getFee(), assetID,
        undefined, UnixNow(), new BN(0), 1,
      );

      const tx1:Tx = txu1.sign(avm.keyChain());
      const tx2:Tx = txu2.sign(avm.keyChain());

      expect(tx2.toBuffer().toString('hex')).toBe(tx1.toBuffer().toString('hex'));
      expect(tx2.toString()).toBe(tx1.toString());
    });

    test('issueTx Serialized', async () => {
      const txu:UnsignedTx = await avm.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1);
      const tx = txu.sign(avm.keyChain());
      const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';

      const result:Promise<string> = avm.issueTx(tx.toString());
      const payload:object = {
        result: {
          txID: txid,
        },
      };
      const responseObj = {
        data: payload,
      };
      mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(response).toBe(txid);
    });

      test('issueTx Buffer', async () => {
        const txu:UnsignedTx = await avm.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1);
        const tx = txu.sign(avm.keyChain());
  
        const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
        const result:Promise<string> = avm.issueTx(tx.toBuffer());
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
  
        expect(response).toBe(txid);
      });

      test('issueTx Class Tx', async () => {
        const txu:UnsignedTx = await avm.buildBaseTx(set, new BN(amnt), addrs3, addrs1, addrs1);
        const tx = txu.sign(avm.keyChain());
  
        const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
  
        const result:Promise<string> = avm.issueTx(tx);
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
  
        expect(response).toBe(txid);
      });


    test('buildImportTx', async () => {
      avm.setFee(new BN(fee));
      const addrbuff1 = addrs1.map((a) => avm.parseAddress(a));
      const fungutxo:string = set.getUTXO(fungutxoids[1]).toString();
      const result:Promise<UnsignedTx> = avm.buildImportTx(
        set, addrs1, PlatformChainID, new UTF8Payload("hello world"), UnixNow()
      );
      const payload:object = {
        result: {
          utxos:[fungutxo]
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const txu1:UnsignedTx = await result;

      const txin:ImportTx = txu1.getTransaction() as ImportTx;
      const importIns:Array<TransferableInput> = txin.getImportInputs();

      const txu2:UnsignedTx = set.buildImportTx(
        networkid, bintools.cb58Decode(blockchainid), 
        addrbuff1, importIns, undefined, avm.getFee(), assetID, 
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

    });

    test('buildExportTx', async () => {
      avm.setFee(new BN(fee));
      const addrbuff1 = addrs1.map((a) => avm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => avm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => avm.parseAddress(a));
      const amount:BN = new BN(90);
      const txu1:UnsignedTx = await avm.buildExportTx(
        set, 
        amount, 
        addrs3, 
        addrs1, 
        addrs2,
        PlatformChainID, 
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildExportTx(
        networkid, bintools.cb58Decode(blockchainid),
        amount,
        assetID, 
        addrbuff3, 
        addrbuff1, 
        addrbuff2, 
        bintools.cb58Decode(PlatformChainID), 
        avm.getFee(), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      const txu3:UnsignedTx = await avm.buildExportTx(
        set, amount, addrs3, addrs1, addrs2, bintools.cb58Decode(PlatformChainID),
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu4:UnsignedTx = set.buildExportTx(
        networkid, bintools.cb58Decode(blockchainid), amount,
        assetID, addrbuff3, addrbuff1, addrbuff2, undefined, avm.getFee(), assetID, 
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );

      expect(txu4.toBuffer().toString('hex')).toBe(txu3.toBuffer().toString('hex'));
      expect(txu4.toString()).toBe(txu3.toString());

    });

  });
});