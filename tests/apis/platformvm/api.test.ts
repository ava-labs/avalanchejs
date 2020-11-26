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
import { KeyChain } from 'src/apis/platformvm/keychain';
import { SECPTransferOutput, TransferableOutput, AmountOutput, ParseableOutput, StakeableLockOut } from 'src/apis/platformvm/outputs';
import { TransferableInput, SECPTransferInput, AmountInput, StakeableLockIn } from 'src/apis/platformvm/inputs';
import { UTXO } from 'src/apis/platformvm/utxos';
import createHash from 'create-hash';
import { UnsignedTx, Tx } from 'src/apis/platformvm/tx';
import { UnixNow } from 'src/utils/helperfunctions';
import { UTF8Payload } from 'src/utils/payload';
import { NodeIDStringToBuffer } from 'src/utils/helperfunctions';
import { ONEAVAX } from 'src/utils/constants';
import { Serializable, Serialization } from 'src/utils/serialization';
import { AddValidatorTx } from 'src/apis/platformvm/validationtx';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

const dumpSerialization:boolean = false;

function serialzeit(aThing:Serializable, name:string){
  if(dumpSerialization){
    console.log(JSON.stringify(serializer.serialize(aThing, "platformvm", "hex", name + " -- Hex Encoded")));
    console.log(JSON.stringify(serializer.serialize(aThing, "platformvm", "display", name + " -- Human-Readable")));
  }
}

describe('PlatformVMAPI', () => {
  const networkid:number = 12345;
  const blockchainid:string = PlatformChainID;
  const ip:string = '127.0.0.1';
  const port:number = 9650;
  const protocol:string = 'https';

  const nodeID:string = "NodeID-B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW";
  const startTime:BN = UnixNow().add(new BN(60 * 5));
  const endTime:BN = startTime.add(new BN(1209600));

  const username:string = 'AvaLabs';
  const password:string = 'password';

  const avalanche:Avalanche = new Avalanche(ip, port, protocol, networkid, undefined, undefined, undefined, true);
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

  test('getCurrentSupply', async () => {
    const supply = new BN('1000000000000', 10);
    const result:Promise<BN> = api.getCurrentSupply();
    const payload:object = {
      result: {
        supply
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:BN = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.toString(10)).toBe(supply.toString(10));
  });

  test('getHeight', async () => {
    const height = new BN('100', 10);
    const result:Promise<BN> = api.getHeight();
    const payload:object = {
      result: {
        height
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:BN = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.toString(10)).toBe(height.toString(10));
  });

  test('getMinStake', async () => {
    const minStake = new BN("2000000000000", 10);
    const minDelegate = new BN("25000000000", 10);
    const result:Promise<object> = api.getMinStake();
    const payload:object = {
      result: {
        minValidatorStake: "2000000000000",
        minDelegatorStake: "25000000000"
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response["minValidatorStake"].toString(10)).toBe(minStake.toString(10));
    expect(response["minDelegatorStake"].toString(10)).toBe(minDelegate.toString(10));
  });

  test('getStake', async () => {
    const staked = new BN('100', 10);
    const result:Promise<object> = api.getStake([addrA]);
    const payload:object = {
      result: {
        staked
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(response)).toBe(JSON.stringify(staked));
  });


  test('addSubnetValidator 1', async () => {
    const nodeID = 'abcdef';
    const subnetID = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const utx = 'valid';
    const result:Promise<string> = api.addSubnetValidator(username, password, nodeID, subnetID, startTime, endTime, weight);
    const payload:object = {
      result: {
        txID: utx,
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

  test('addSubnetValidator', async () => {
    const nodeID = 'abcdef';
    const subnetID = Buffer.from('abcdef', 'hex');
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const utx = 'valid';
    const result:Promise<string> = api.addSubnetValidator(username, password, nodeID, subnetID, startTime, endTime, weight);
    const payload:object = {
      result: {
        txID: utx,
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

  test('addDelegator 1', async () => {
    const nodeID = 'abcdef';
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const stakeAmount = new BN(13);
    const rewardAddress = 'fedcba';
    const utx = 'valid';
    const result:Promise<string> = api.addDelegator(username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress);
    const payload:object = {
      result: {
        txID: utx,
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
    const result:Promise<object> = api.getCurrentValidators();
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toStrictEqual({validators});
  });

  test('getCurrentValidators 2', async () => {
    const subnetID:string = 'abcdef';
    const validators = ['val1', 'val2'];
    const result:Promise<object> = api.getCurrentValidators(subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toStrictEqual({validators});
  });

  test('getCurrentValidators 3', async () => {
    const subnetID:Buffer = Buffer.from('abcdef', 'hex');
    const validators = ['val1', 'val2'];
    const result:Promise<object> = api.getCurrentValidators(subnetID);
    const payload:object = {
      result: {
        validators,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toStrictEqual({validators});
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
    let result:Promise<string> = api.importAVAX(username, password, to, blockchainid);
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

  test('createBlockchain', async () => {
    const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const vmID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const name:string = 'Some Blockchain';
    const genesis:string = '{ruh:"roh"}';
    const subnetID:Buffer = Buffer.from('abcdef', 'hex');
    const result:Promise<string> = api.createBlockchain(username, password, subnetID, vmID, [1,2,3], name, genesis);
    const payload:object = {
      result: {
        txID: blockchainID,
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
    const utx = 'valid';
    const result:Promise<string> = api.createSubnet(username, password, controlKeys, threshold);
    const payload:object = {
      result: {
        txID: utx,
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

  test('getTx', async () => {
    const txid:string = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';

    const result:Promise<string> = api.getTx(txid);
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

    const result:Promise<string|{status:string, reason:string}> = api.getTxStatus(txid);
    const payload:object = {
      result:  'accepted'
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string|{status:string, reason:string} = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe('accepted');
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
    let result:Promise<{
      numFetched:number,
      utxos:UTXOSet,
      endIndex:{address:string, utxo:string}
    }> = api.getUTXOs(addresses, api.getBlockchainID(), 0, undefined, persistOpts);
    const payload:object = {
      result: {
        numFetched:3,
        utxos: [OPUTXOstr1, OPUTXOstr2, OPUTXOstr3],
        stopIndex: {address: "a", utxo: "b"}
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    let response:UTXOSet = (await result).utxos;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));

    addresses = set.getAddresses().map((a) => api.addressFromBuffer(a));
    result =  api.getUTXOs(addresses, api.getBlockchainID(), 0, undefined, persistOpts);

    mockAxios.mockResponse(responseObj);
    response = (await result).utxos;

    expect(mockAxios.request).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));
  });


  describe('Transactions', () => {
    let set:UTXOSet;
    let lset:UTXOSet;
    let keymgr2:KeyChain;
    let keymgr3:KeyChain;
    let addrs1:Array<string>;
    let addrs2:Array<string>;
    let addrs3:Array<string>;
    let addressbuffs:Array<Buffer> = [];
    let addresses:Array<string> = [];
    let utxos:Array<UTXO>;
    let lutxos:Array<UTXO>;
    let inputs:Array<TransferableInput>;
    let outputs:Array<TransferableOutput>;
    const amnt:number = 10000;
    const assetID:Buffer = Buffer.from(createHash('sha256').update('mary had a little lamb').digest());
    const NFTassetID:Buffer = Buffer.from(createHash('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    let secpbase1:SECPTransferOutput;
    let secpbase2:SECPTransferOutput;
    let secpbase3:SECPTransferOutput;
    let fungutxoids:Array<string> = [];
    let platformvm:PlatformVMAPI;
    const fee:number = 10;
    const name:string = 'Mortycoin is the dumb as a sack of hammers.';
    const symbol:string = 'morT';
    const denomination:number = 8;

    beforeEach(async () => {
      platformvm = new PlatformVMAPI(avalanche, "/ext/bc/P");
      const result:Promise<Buffer> = platformvm.getAVAXAssetID();
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
      lset = new UTXOSet;
      platformvm.newKeyChain();
      keymgr2 = new KeyChain(avalanche.getHRP(), alias);
      keymgr3 = new KeyChain(avalanche.getHRP(), alias);
      addrs1 = [];
      addrs2 = [];
      addrs3 = [];
      utxos = [];
      lutxos = [];
      inputs = [];
      outputs = [];
      fungutxoids = [];
      const pload:Buffer = Buffer.alloc(1024);
      pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');

      for (let i:number = 0; i < 3; i++) {
        addrs1.push(platformvm.addressFromBuffer(platformvm.keyChain().makeKey().getAddress()));
        addrs2.push(platformvm.addressFromBuffer(keymgr2.makeKey().getAddress()));
        addrs3.push(platformvm.addressFromBuffer(keymgr3.makeKey().getAddress()));
      }
      const amount:BN = ONEAVAX.mul(new BN(amnt));
      addressbuffs = platformvm.keyChain().getAddresses();
      addresses = addressbuffs.map((a) => platformvm.addressFromBuffer(a));
      const locktime:BN = new BN(54321);
      const threshold:number = 3;
      for (let i:number = 0; i < 5; i++) {
        let txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
        let txidx:Buffer = Buffer.alloc(4);
        txidx.writeUInt32BE(i, 0);
        
        const out:SECPTransferOutput = new SECPTransferOutput(amount, addressbuffs, locktime, threshold);
        const xferout:TransferableOutput = new TransferableOutput(assetID, out);
        outputs.push(xferout);

        const u:UTXO = new UTXO();
        u.fromBuffer(Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
        fungutxoids.push(u.getUTXOID());
        utxos.push(u);

        txid = u.getTxID();
        txidx = u.getOutputIdx();
        const asset = u.getAssetID();

        const input:SECPTransferInput = new SECPTransferInput(amount);
        const xferinput:TransferableInput = new TransferableInput(txid, txidx, asset, input);
        inputs.push(xferinput);
      }
      set.addArray(utxos);
      for (let i:number = 0; i < 4; i++) {
        let txid:Buffer = Buffer.from(createHash('sha256').update(bintools.fromBNToBuffer(new BN(i), 32)).digest());
        let txidx:Buffer = Buffer.alloc(4);
        txidx.writeUInt32BE(i, 0);
        
        const out:SECPTransferOutput = new SECPTransferOutput(ONEAVAX.mul(new BN(5)), addressbuffs, locktime, 1);
        const pout:ParseableOutput = new ParseableOutput(out);
        const lockout:StakeableLockOut = new StakeableLockOut(ONEAVAX.mul(new BN(5)), addressbuffs, locktime, 1, locktime.add(new BN(86400)), pout);
        const xferout:TransferableOutput = new TransferableOutput(assetID, lockout);

        const u:UTXO = new UTXO();
        u.fromBuffer(Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
        lutxos.push(u);
      }
      
      lset.addArray(lutxos);
      lset.addArray(set.getAllUTXOs());
      

      secpbase1 = new SECPTransferOutput(new BN(777), addrs3.map((a) => platformvm.parseAddress(a)), UnixNow(), 1);
      secpbase2 = new SECPTransferOutput(new BN(888), addrs2.map((a) => platformvm.parseAddress(a)), UnixNow(), 1);
      secpbase3 = new SECPTransferOutput(new BN(999), addrs2.map((a) => platformvm.parseAddress(a)), UnixNow(), 1);

    });

    test('signTx', async () => {
      const assetID = await platformvm.getAVAXAssetID();
      const txu2:UnsignedTx = set.buildBaseTx(
        networkid, bintools.cb58Decode(blockchainid), new BN(amnt), assetID,
        addrs3.map((a) => platformvm.parseAddress(a)),
        addrs1.map((a) => platformvm.parseAddress(a)),
        addrs1.map((a) => platformvm.parseAddress(a)),
        platformvm.getTxFee(), assetID,
        undefined, UnixNow(), new BN(0), 1,
      );

      const tx2:Tx = txu2.sign(platformvm.keyChain());
    });

    test('buildImportTx', async () => {
      let locktime:BN = new BN(0);
      let threshold:number = 1;
      platformvm.setTxFee(new BN(fee));
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const fungutxo:UTXO = set.getUTXO(fungutxoids[1]);
      const fungutxostr:string = fungutxo.toString();

      const result:Promise<UnsignedTx> = platformvm.buildImportTx(
        set,addrs1, PlatformChainID, addrs3, addrs1, addrs2, new UTF8Payload("hello world"), UnixNow(), locktime, threshold
      );
      const payload:object = {
        result: {
          utxos:[fungutxostr]
        },
      };
      const responseObj = {
        data: payload,
      };

      mockAxios.mockResponse(responseObj);
      const txu1:UnsignedTx = await result;

      const txu2:UnsignedTx = set.buildImportTx(
        networkid, bintools.cb58Decode(blockchainid), 
        addrbuff3, addrbuff1, addrbuff2, [fungutxo], bintools.cb58Decode(PlatformChainID), platformvm.getTxFee(), await platformvm.getAVAXAssetID(), 
        new UTF8Payload("hello world").getPayload(), UnixNow(), locktime, threshold
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");
      
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");
      
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "ImportTx");
    });

    test('buildExportTx', async () => {

      platformvm.setTxFee(new BN(fee));
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = new BN(90);
      const txu1:UnsignedTx = await platformvm.buildExportTx(
        set, 
        amount,
        bintools.cb58Decode(Defaults.network[avalanche.getNetworkID()].X["blockchainID"]),
        addrbuff3.map((a) => bintools.addressToString(avalanche.getHRP(), "P", a)), 
        addrs1, 
        addrs2,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildExportTx(
        networkid, bintools.cb58Decode(blockchainid),
        amount,
        assetID, 
        addrbuff3, 
        addrbuff1, 
        addrbuff2, 
        bintools.cb58Decode(Defaults.network[avalanche.getNetworkID()].X["blockchainID"]), 
        platformvm.getTxFee(), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );

      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      const txu3:UnsignedTx = await platformvm.buildExportTx(
        set, amount, bintools.cb58Decode(Defaults.network[avalanche.getNetworkID()].X["blockchainID"]), 
        addrs3, addrs1, addrs2, 
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu4:UnsignedTx = set.buildExportTx(
        networkid, bintools.cb58Decode(blockchainid), amount,
        assetID, addrbuff3, addrbuff1, addrbuff2, undefined, platformvm.getTxFee(), assetID, 
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );

      expect(txu4.toBuffer().toString('hex')).toBe(txu3.toBuffer().toString('hex'));
      expect(txu4.toString()).toBe(txu3.toString());


      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);

      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");

      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");

      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "ExportTx");

    });
/*
    test('buildAddSubnetValidatorTx', async () => {
      platformvm.setFee(new BN(fee));
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = new BN(90);

      const txu1:UnsignedTx = await platformvm.buildAddSubnetValidatorTx(
        set,  
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        PlatformVMConstants.MINSTAKE,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildAddSubnetValidatorTx(
        networkid, bintools.cb58Decode(blockchainid), 
        addrbuff1,         
        addrbuff2, 
        NodeIDStringToBuffer(nodeID), 
        startTime,
        endTime,
        PlatformVMConstants.MINSTAKE,
        platformvm.getFee(), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

    });
*/
    test('buildAddDelegatorTx 1', async () => {
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = Defaults.network[networkid]["P"].minDelegationStake;

      const locktime:BN = new BN(54321);
      const threshold:number = 2;

      platformvm.setMinStake(Defaults.network[networkid]["P"].minStake, Defaults.network[networkid]["P"].minDelegationStake);

      const txu1:UnsignedTx = await platformvm.buildAddDelegatorTx(
        set, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        amount,
        addrs3, 
        locktime,
        threshold,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildAddDelegatorTx(
        networkid, bintools.cb58Decode(blockchainid), 
        assetID,
        addrbuff3,
        addrbuff1,         
        addrbuff2, 
        NodeIDStringToBuffer(nodeID), 
        startTime,
        endTime,
        amount,
        locktime,
        threshold,
        addrbuff3,
        new BN(0), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");
      
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");
      
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "AddDelegatorTx");

    });

    test('buildAddValidatorTx sort StakeableLockOuts 1', async () => {
      // two UTXO. The 1st has a lesser stakeablelocktime and a greater amount of AVAX. The 2nd has a greater stakeablelocktime and a lesser amount of AVAX.
      // We expect this test to only consume the 2nd UTXO since it has the greater locktime.
      const addrbuff1: Buffer[] = addrs1.map((a) => platformvm.parseAddress(a));
      const amount1: BN = new BN('20000000000000000');
      const amount2: BN = new BN('10000000000000000');
      const locktime1: BN = new BN(0);
      const threshold: number = 1;
      
      const stakeableLockTime1: BN = new BN(1633824000);
      const secpTransferOutput1: SECPTransferOutput = new SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
      const parseableOutput1: ParseableOutput = new ParseableOutput(secpTransferOutput1);
      const stakeableLockOut1: StakeableLockOut = new StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
      const stakeableLockTime2: BN = new BN(1733824000);
      const secpTransferOutput2: SECPTransferOutput = new SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
      const parseableOutput2: ParseableOutput = new ParseableOutput(secpTransferOutput2);
      const stakeableLockOut2: StakeableLockOut = new StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
      const nodeID: string = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
      const stakeAmount: BN = Defaults.network[networkid]["P"].minStake;
      platformvm.setMinStake(stakeAmount, Defaults.network[networkid]["P"].minDelegationStake);
      const delegationFeeRate: number = new BN(2).toNumber();
      const codecID: number = 0;
      const txid: Buffer = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
      const txid2: Buffer = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv'); 
      const outputidx0: number = 0;
      const outputidx1: number = 0;
      const assetID = await platformvm.getAVAXAssetID();
      const assetID2 = await platformvm.getAVAXAssetID();
      const utxo1: UTXO = new UTXO(codecID, txid, outputidx0, assetID, stakeableLockOut1);
      const utxo2: UTXO = new UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
      const utxoSet: UTXOSet =  new UTXOSet();
      utxoSet.add(utxo1);
      utxoSet.add(utxo2);
      const txu1: UnsignedTx = await platformvm.buildAddValidatorTx(
        utxoSet, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        stakeAmount,
        addrs3, 
        delegationFeeRate
      );
      let tx = txu1.getTransaction() as AddValidatorTx;
      let ins: TransferableInput[] = tx.getIns();
      // start test inputs
      // confirm only 1 input
      expect(ins.length).toBe(1);
      let input: TransferableInput = ins[0];
      let ai = input.getInput() as AmountInput;
      let ao = stakeableLockOut2.getTransferableOutput().getOutput() as AmountOutput;
      let ao2 = stakeableLockOut1.getTransferableOutput().getOutput() as AmountOutput;
      // confirm input amount matches the output w/ the greater staekablelock time but lesser amount
      expect(ai.getAmount().toString()).toEqual(ao.getAmount().toString())
      // confirm input amount doesn't match the output w/ the lesser staekablelock time but greater amount
      expect(ai.getAmount().toString()).not.toEqual(ao2.getAmount().toString())

      let sli = input.getInput() as StakeableLockIn;
      // confirm input stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
      expect(sli.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
      // confirm input stakeablelock time doesn't match the output w/ the lesser stakeablelock time but greater amount
      expect(sli.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      // stop test inputs

      // start test outputs
      let outs: TransferableOutput[] = tx.getOuts();
      // confirm only 1 output
      expect(outs.length).toBe(1);
      let output: TransferableOutput = outs[0];
      let ao3 = output.getOutput() as AmountOutput;
      // confirm output amount matches the output w/ the greater stakeablelock time but lesser amount sans the stake amount
      expect(ao3.getAmount().toString()).toEqual(ao.getAmount().sub(stakeAmount).toString())
      // confirm output amount doesn't match the output w/ the lesser stakeablelock time but greater amount
      expect(ao3.getAmount().toString()).not.toEqual(ao2.getAmount().toString())

      let slo = output.getOutput() as StakeableLockOut;
      // confirm output stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
      expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
      // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time but lesser amount 
      expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());

      // confirm tx nodeID matches nodeID
      expect(tx.getNodeIDString()).toEqual(nodeID);
      // confirm tx starttime matches starttime
      expect(tx.getStartTime().toString()).toEqual(startTime.toString());
      // confirm tx endtime matches endtime 
      expect(tx.getEndTime().toString()).toEqual(endTime.toString());
      // confirm tx stake amount matches stakeAmount
      expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());

      let stakeOuts: TransferableOutput[] = tx.getStakeOuts();
      // confirm only 1 stakeOut
      expect(stakeOuts.length).toBe(1);

      let stakeOut: TransferableOutput = stakeOuts[0];
      let slo2 = stakeOut.getOutput() as StakeableLockOut;
      // confirm stakeOut stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
      expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
      // confirm stakeOut stakeablelock time doesn't match the output w/ the greater stakeablelock time but lesser amount 
      expect(slo2.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      slo2.getAmount()
      // confirm stakeOut stake amount matches stakeAmount
      expect(slo2.getAmount().toString()).toEqual(stakeAmount.toString());
    });

    test('buildAddValidatorTx sort StakeableLockOuts 2', async () => {

      // two UTXO. The 1st has a lesser stakeablelocktime and a greater amount of AVAX. The 2nd has a greater stakeablelocktime and a lesser amount of AVAX.
      // this time we're staking a greater amount than is available in the 2nd UTXO.
      // We expect this test to consume the full 2nd UTXO and a fraction of the 1st UTXO..
      const addrbuff1: Buffer[] = addrs1.map((a) => platformvm.parseAddress(a));
      const amount1: BN = new BN('20000000000000000');
      const amount2: BN = new BN('10000000000000000');
      const locktime1: BN = new BN(0);
      const threshold: number = 1;
      
      const stakeableLockTime1: BN = new BN(1633824000);
      const secpTransferOutput1: SECPTransferOutput = new SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
      const parseableOutput1: ParseableOutput = new ParseableOutput(secpTransferOutput1);
      const stakeableLockOut1: StakeableLockOut = new StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
      const stakeableLockTime2: BN = new BN(1733824000);
      const secpTransferOutput2: SECPTransferOutput = new SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
      const parseableOutput2: ParseableOutput = new ParseableOutput(secpTransferOutput2);
      const stakeableLockOut2: StakeableLockOut = new StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
      const nodeID: string = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
      const stakeAmount: BN = new BN('10000003000000000');
      platformvm.setMinStake(stakeAmount, Defaults.network[networkid]["P"].minDelegationStake);
      const delegationFeeRate: number = new BN(2).toNumber();
      const codecID: number = 0;
      const txid: Buffer = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
      const txid2: Buffer = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv'); 
      const outputidx0: number = 0;
      const outputidx1: number = 0;
      const assetID = await platformvm.getAVAXAssetID();
      const assetID2 = await platformvm.getAVAXAssetID();
      const utxo1: UTXO = new UTXO(codecID, txid, outputidx0, assetID, stakeableLockOut1);
      const utxo2: UTXO = new UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
      const utxoSet: UTXOSet =  new UTXOSet();
      utxoSet.add(utxo1);
      utxoSet.add(utxo2);
      const txu1: UnsignedTx = await platformvm.buildAddValidatorTx(
        utxoSet, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        stakeAmount,
        addrs3, 
        delegationFeeRate
      );
      let tx = txu1.getTransaction() as AddValidatorTx;
      let ins: TransferableInput[] = tx.getIns();
      // start test inputs
      // confirm only 1 input
      expect(ins.length).toBe(2);
      let input1: TransferableInput = ins[0];
      let input2: TransferableInput = ins[1];
      let ai1 = input1.getInput() as AmountInput;
      let ai2 = input2.getInput() as AmountInput;
      let ao1 = stakeableLockOut2.getTransferableOutput().getOutput() as AmountOutput;
      let ao2 = stakeableLockOut1.getTransferableOutput().getOutput() as AmountOutput;
      // confirm each input amount matches the corresponding output 
      expect(ai2.getAmount().toString()).toEqual(ao1.getAmount().toString())
      expect(ai1.getAmount().toString()).toEqual(ao2.getAmount().toString())

      let sli1 = input1.getInput() as StakeableLockIn;
      let sli2 = input2.getInput() as StakeableLockIn;
      // confirm input strakeablelock time matches the output w/ the greater staekablelock time but lesser amount 
      expect(sli1.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      expect(sli2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
      // stop test inputs

      // start test outputs
      let outs: TransferableOutput[] = tx.getOuts();
      // confirm only 1 output
      expect(outs.length).toBe(1);
      let output: TransferableOutput = outs[0];
      let ao3 = output.getOutput() as AmountOutput;
      // confirm output amount matches the output amount sans the 2nd utxo amount and the stake amount
      expect(ao3.getAmount().toString()).toEqual(ao2.getAmount().sub(stakeAmount.sub(ao1.getAmount())).toString())

      let slo = output.getOutput() as StakeableLockOut;
      // confirm output stakeablelock time matches the output w/ the lesser stakeablelock since the other was consumed
      expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time  
      expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut2.getStakeableLocktime().toString());

      // confirm tx nodeID matches nodeID
      expect(tx.getNodeIDString()).toEqual(nodeID);
      // confirm tx starttime matches starttime
      expect(tx.getStartTime().toString()).toEqual(startTime.toString());
      // confirm tx endtime matches endtime 
      expect(tx.getEndTime().toString()).toEqual(endTime.toString());
      // confirm tx stake amount matches stakeAmount
      expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());

      let stakeOuts: TransferableOutput[] = tx.getStakeOuts();
      // confirm 2 stakeOuts
      expect(stakeOuts.length).toBe(2);

      let stakeOut1: TransferableOutput = stakeOuts[0];
      let stakeOut2: TransferableOutput = stakeOuts[1];
      let slo2 = stakeOut1.getOutput() as StakeableLockOut;
      let slo3 = stakeOut2.getOutput() as StakeableLockOut;
      // confirm both stakeOut strakeablelock times matche the corresponding output  
      expect(slo3.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
    });

    test('buildAddValidatorTx sort StakeableLockOuts 3', async () => {
      // three UTXO. 
      // The 1st is a SecpTransferableOutput. 
      // The 2nd has a lesser stakeablelocktime and a greater amount of AVAX. 
      // The 3rd has a greater stakeablelocktime and a lesser amount of AVAX.
      // 
      // this time we're staking a greater amount than is available in the 3rd UTXO.
      // We expect this test to consume the full 3rd UTXO and a fraction of the 2nd UTXO and not to consume the SecpTransferableOutput
      const addrbuff1: Buffer[] = addrs1.map((a) => platformvm.parseAddress(a));
      const amount1: BN = new BN('20000000000000000');
      const amount2: BN = new BN('10000000000000000');
      const locktime1: BN = new BN(0);
      const threshold: number = 1;
      
      const stakeableLockTime1: BN = new BN(1633824000);
      const secpTransferOutput0: SECPTransferOutput = new SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
      const secpTransferOutput1: SECPTransferOutput = new SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
      const parseableOutput1: ParseableOutput = new ParseableOutput(secpTransferOutput1);
      const stakeableLockOut1: StakeableLockOut = new StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
      const stakeableLockTime2: BN = new BN(1733824000);
      const secpTransferOutput2: SECPTransferOutput = new SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
      const parseableOutput2: ParseableOutput = new ParseableOutput(secpTransferOutput2);
      const stakeableLockOut2: StakeableLockOut = new StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
      const nodeID: string = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
      const stakeAmount: BN = new BN('10000003000000000');
      platformvm.setMinStake(stakeAmount, Defaults.network[networkid]["P"].minDelegationStake);
      const delegationFeeRate: number = new BN(2).toNumber();
      const codecID: number = 0;
      const txid0: Buffer = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
      const txid1: Buffer = bintools.cb58Decode('2jhyJit8kWA6SwkRwKxXepFnfhs971CEqaGkjJmiADM8H4g2LR');
      const txid2: Buffer = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv'); 
      const outputidx0: number = 0;
      const outputidx1: number = 0;
      const assetID = await platformvm.getAVAXAssetID();
      const assetID2 = await platformvm.getAVAXAssetID();
      const utxo0: UTXO = new UTXO(codecID, txid0, outputidx0, assetID, secpTransferOutput0);
      const utxo1: UTXO = new UTXO(codecID, txid1, outputidx0, assetID, stakeableLockOut1);
      const utxo2: UTXO = new UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
      const utxoSet: UTXOSet =  new UTXOSet();
      utxoSet.add(utxo0);
      utxoSet.add(utxo1);
      utxoSet.add(utxo2);
      const txu1: UnsignedTx = await platformvm.buildAddValidatorTx(
        utxoSet, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        stakeAmount,
        addrs3, 
        delegationFeeRate
      );
      let tx = txu1.getTransaction() as AddValidatorTx;
      let ins: TransferableInput[] = tx.getIns();
      // start test inputs
      // confirm only 1 input
      expect(ins.length).toBe(2);
      let input1: TransferableInput = ins[0];
      let input2: TransferableInput = ins[1];
      let ai1 = input1.getInput() as AmountInput;
      let ai2 = input2.getInput() as AmountInput;
      let ao1 = stakeableLockOut2.getTransferableOutput().getOutput() as AmountOutput;
      let ao2 = stakeableLockOut1.getTransferableOutput().getOutput() as AmountOutput;
      // confirm each input amount matches the corresponding output 
      expect(ai2.getAmount().toString()).toEqual(ao2.getAmount().toString())
      expect(ai1.getAmount().toString()).toEqual(ao1.getAmount().toString())

      let sli1 = input1.getInput() as StakeableLockIn;
      let sli2 = input2.getInput() as StakeableLockIn;
      // confirm input strakeablelock time matches the output w/ the greater staekablelock time but lesser amount 
      expect(sli1.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
      expect(sli2.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      // stop test inputs

      // start test outputs
      let outs: TransferableOutput[] = tx.getOuts();
      // confirm only 1 output
      expect(outs.length).toBe(1);
      let output: TransferableOutput = outs[0];
      let ao3 = output.getOutput() as AmountOutput;
      // confirm output amount matches the output amount sans the 2nd utxo amount and the stake amount
      expect(ao3.getAmount().toString()).toEqual(ao2.getAmount().sub(stakeAmount.sub(ao1.getAmount())).toString())

      let slo = output.getOutput() as StakeableLockOut;
      // confirm output stakeablelock time matches the output w/ the lesser stakeablelock since the other was consumed
      expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time  
      expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut2.getStakeableLocktime().toString());

      // confirm tx nodeID matches nodeID
      expect(tx.getNodeIDString()).toEqual(nodeID);
      // confirm tx starttime matches starttime
      expect(tx.getStartTime().toString()).toEqual(startTime.toString());
      // confirm tx endtime matches endtime 
      expect(tx.getEndTime().toString()).toEqual(endTime.toString());
      // confirm tx stake amount matches stakeAmount
      expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());

      let stakeOuts: TransferableOutput[] = tx.getStakeOuts();
      // confirm 2 stakeOuts
      expect(stakeOuts.length).toBe(2);

      let stakeOut1: TransferableOutput = stakeOuts[0];
      let stakeOut2: TransferableOutput = stakeOuts[1];
      let slo2 = stakeOut1.getOutput() as StakeableLockOut;
      let slo3 = stakeOut2.getOutput() as StakeableLockOut;
      // confirm both stakeOut strakeablelock times matche the corresponding output  
      expect(slo3.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
      expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
    });

    test('buildAddValidatorTx 1', async () => {
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = Defaults.network[networkid]["P"].minStake.add(new BN(fee));

      const locktime:BN = new BN(54321);
      const threshold:number = 2;

      platformvm.setMinStake(Defaults.network[networkid]["P"].minStake, Defaults.network[networkid]["P"].minDelegationStake);

      const txu1:UnsignedTx = await platformvm.buildAddValidatorTx(
        set, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        amount,
        addrs3, 
        0.1334556,
        locktime,
        threshold,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildAddValidatorTx(
        networkid, bintools.cb58Decode(blockchainid), 
        assetID,
        addrbuff3,
        addrbuff1,         
        addrbuff2, 
        NodeIDStringToBuffer(nodeID), 
        startTime,
        endTime,
        amount,
        locktime,
        threshold,
        addrbuff3,
        0.1335,
        new BN(0),
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");

      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");

      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "AddValidatorTx");

    });

    test('buildAddDelegatorTx 2', async () => {
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = Defaults.network[networkid]["P"].minDelegationStake;

      const locktime:BN = new BN(54321);
      const threshold:number = 2;

      platformvm.setMinStake(Defaults.network[networkid]["P"].minStake, Defaults.network[networkid]["P"].minDelegationStake);

      const txu1:UnsignedTx = await platformvm.buildAddDelegatorTx(
        lset, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        amount,
        addrs3, 
        locktime,
        threshold,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = lset.buildAddDelegatorTx(
        networkid, bintools.cb58Decode(blockchainid), 
        assetID,
        addrbuff3,
        addrbuff1,         
        addrbuff2, 
        NodeIDStringToBuffer(nodeID), 
        startTime,
        endTime,
        amount,
        locktime,
        threshold,
        addrbuff3,
        new BN(0), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");
      
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");
      
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "AddDelegatorTx");

    });

    test('buildAddValidatorTx 2', async () => {
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = ONEAVAX.mul(new BN(25));

      const locktime:BN = new BN(54321);
      const threshold:number = 2;

      platformvm.setMinStake(ONEAVAX.mul(new BN(25)), ONEAVAX.mul(new BN(25)));

      const txu1:UnsignedTx = await platformvm.buildAddValidatorTx(
        lset, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        amount,
        addrs3, 
        0.1334556,
        locktime,
        threshold,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = lset.buildAddValidatorTx(
        networkid, bintools.cb58Decode(blockchainid), 
        assetID,
        addrbuff3,
        addrbuff1,         
        addrbuff2, 
        NodeIDStringToBuffer(nodeID), 
        startTime,
        endTime,
        amount,
        locktime,
        threshold,
        addrbuff3,
        0.1335,
        new BN(0), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");

      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");

      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "AddValidatorTx");

    });

    test('buildAddValidatorTx 3', async () => {
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
      const amount:BN = ONEAVAX.mul(new BN(3));

      const locktime:BN = new BN(54321);
      const threshold:number = 2;

      platformvm.setMinStake(ONEAVAX.mul(new BN(3)), ONEAVAX.mul(new BN(3)));

      //2 utxos; one lockedstakeable; other unlocked; both utxos have 2 avax; stake 3 AVAX

      let dummySet:UTXOSet = new UTXOSet();

      let lockedBaseOut:SECPTransferOutput = new SECPTransferOutput(ONEAVAX.mul(new BN(2)), addrbuff1, locktime, 1);
      let lockedBaseXOut:ParseableOutput = new ParseableOutput(lockedBaseOut);
      let lockedOut:StakeableLockOut = new StakeableLockOut(ONEAVAX.mul(new BN(2)), addrbuff1, locktime, 1, locktime, lockedBaseXOut)
      
      let txidLocked:Buffer = Buffer.alloc(32);
      txidLocked.fill(1);
      let txidxLocked:Buffer = Buffer.alloc(4);
      txidxLocked.writeUInt32BE(1, 0);
      const lu:UTXO = new UTXO(0, txidLocked, txidxLocked, assetID, lockedOut);
      
      let txidUnlocked:Buffer = Buffer.alloc(32);
      txidUnlocked.fill(2);
      let txidxUnlocked:Buffer = Buffer.alloc(4);
      txidxUnlocked.writeUInt32BE(2, 0);
      let unlockedOut:SECPTransferOutput = new SECPTransferOutput(ONEAVAX.mul(new BN(2)), addrbuff1, locktime, 1);
      const ulu:UTXO = new UTXO(0, txidUnlocked, txidxUnlocked, assetID, unlockedOut);

      dummySet.add(ulu);
      dummySet.add(lu);

      const txu1:UnsignedTx = await platformvm.buildAddValidatorTx(
        dummySet, 
        addrs3,
        addrs1, 
        addrs2, 
        nodeID, 
        startTime,
        endTime,
        amount,
        addrs3, 
        0.1334556,
        locktime,
        threshold,
        new UTF8Payload("hello world"), UnixNow()
      );

      let txu1Ins = (txu1.getTransaction() as AddValidatorTx).getIns();
      let txu1Outs = (txu1.getTransaction() as AddValidatorTx).getOuts();
      let txu1Stake = (txu1.getTransaction() as AddValidatorTx).getStakeOuts();
      let txu1Total = (txu1.getTransaction() as AddValidatorTx).getTotalOuts();

      let intotal:BN = new BN(0);

      for(let i = 0; i < txu1Ins.length; i++) {
        intotal = intotal.add((txu1Ins[i].getInput() as AmountInput).getAmount());
      }

      let outtotal:BN = new BN(0);

      for(let i = 0; i < txu1Outs.length; i++) {
        outtotal = outtotal.add((txu1Outs[i].getOutput() as AmountOutput).getAmount());
      }

      let staketotal:BN = new BN(0);

      for(let i = 0; i < txu1Stake.length; i++) {
        staketotal = staketotal.add((txu1Stake[i].getOutput() as AmountOutput).getAmount());
      }

      let totaltotal:BN = new BN(0);

      for(let i = 0; i < txu1Total.length; i++) {
        totaltotal = totaltotal.add((txu1Total[i].getOutput() as AmountOutput).getAmount());
      }

      expect(intotal.toString(10)).toBe("4000000000");
      expect(outtotal.toString(10)).toBe("1000000000");
      expect(staketotal.toString(10)).toBe("3000000000");
      expect(totaltotal.toString(10)).toBe("4000000000");

    });

    test('buildCreateSubnetTx1', async () => {
      platformvm.setCreationTxFee(new BN(10));
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));

      const txu1:UnsignedTx = await platformvm.buildCreateSubnetTx(
        set, 
        addrs1, 
        addrs2, 
        addrs3, 
        1,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = set.buildCreateSubnetTx(
        networkid, bintools.cb58Decode(blockchainid), 
        addrbuff1,         
        addrbuff2, 
        addrbuff3,
        1,
        platformvm.getCreationTxFee(), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

      let tx1:Tx = txu1.sign(platformvm.keyChain());
      let checkTx:string = tx1.toBuffer().toString("hex");
      let tx1obj:object = tx1.serialize("hex");
      let tx1str:string = JSON.stringify(tx1obj);
      
      let tx2newobj:object = JSON.parse(tx1str);
      let tx2:Tx = new Tx();
      tx2.deserialize(tx2newobj, "hex");
      
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx);

      let tx3:Tx = txu1.sign(platformvm.keyChain());
      let tx3obj:object = tx3.serialize("display");
      let tx3str:string = JSON.stringify(tx3obj);
      
      let tx4newobj:object = JSON.parse(tx3str);
      let tx4:Tx = new Tx();
      tx4.deserialize(tx4newobj, "display");
      
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx);

      serialzeit(tx1, "CreateSubnetTx");

    });

    test('buildCreateSubnetTx 2', async () => {
      platformvm.setCreationTxFee(new BN(10));
      const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
      const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
      const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));

      const txu1:UnsignedTx = await platformvm.buildCreateSubnetTx(
        lset, 
        addrs1, 
        addrs2, 
        addrs3, 
        1,
        new UTF8Payload("hello world"), UnixNow()
      );

      const txu2:UnsignedTx = lset.buildCreateSubnetTx(
        networkid, bintools.cb58Decode(blockchainid), 
        addrbuff1,         
        addrbuff2, 
        addrbuff3,
        1, 
        platformvm.getCreationTxFee(), 
        assetID,
        new UTF8Payload("hello world").getPayload(), UnixNow()
      );
      expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
      expect(txu2.toString()).toBe(txu1.toString());

    });


  });
});
