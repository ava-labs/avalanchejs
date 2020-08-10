import mockAxios from 'jest-mock-axios';

import { Avalanche } from 'src';
import PlatformVMAPI from 'src/apis/platformvm/api';
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from 'src/utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe('Platform', () => {
  const ip = '127.0.0.1';
  const port = 9650;
  const protocol = 'https';

  const username = 'AvaLabs';
  const password = 'password';

  const avalanche = new Avalanche(ip, port, protocol, 12345, undefined, undefined, true);
  let platform:PlatformVMAPI;

  beforeAll(() => {
    platform = new PlatformVMAPI(avalanche);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('createBlockchain 1', async () => {
    const blockchainID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const vmID:string = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
    const name:string = 'Some Blockchain';
    const genesis:string = '{ruh:"roh"}';
    const result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis);
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
    const result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis, subnetID);
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
    const result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis, subnetID);
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
    const result:Promise<string> = platform.getBlockchainStatus(blockchainID);
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

  test('createAccount 1', async () => {
    const address = 'deadbeef';
    let privateKey;
    const username = 'Robert';
    const password = 'Paulson';
    const result:Promise<string> = platform.createAccount(username, password, privateKey);
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

  test('createAccount 2', async () => {
    const address = 'deadbeef';
    const privateKey = 'abcdef';
    const username = 'Robert';
    const password = 'Paulson';
    const result:Promise<string> = platform.createAccount(username, password, privateKey);
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

  test('createAccount 3', async () => {
    const address = 'deadbeef';
    const privateKey = Buffer.from('abcdef', 'hex');
    const username = 'Robert';
    const password = 'Paulson';
    const result:Promise<string> = platform.createAccount(username, password, privateKey);
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

  test('getAccount', async () => {
    const address = 'deadbeef';
    const result:Promise<object> = platform.getAccount(address);
    const resultobj = {
      address,
      nonce: '0',
      balance: '0',
    };
    const payload:object = {
      result: resultobj,
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(resultobj);
  });

  test('exportPrivateKey', async () => {
    const address = 'deadbeef';
    const username = 'Robert';
    const password = 'Paulson';
    const privateKey = 'abcdef';
    const result: Promise<string> = platform.exportKey(username, password, address);
    const resultobj = {
      privateKey,
    };
    const payload:object = {
      result: resultobj,
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(privateKey);
  });

  test('importPrivateKey', async () => {
    const address = 'deadbeef';
    const username = 'Robert';
    const password = 'Paulson';
    let privateKey;
    const result: Promise<string> = platform.importKey(username, password, privateKey);
    const resultobj = {
      address,
    };
    const payload:object = {
      result: resultobj,
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(address);
  });

  test('listAccounts', async () => {
    const username = 'Robert';
    const password = 'Paulson';
    const result:Promise<object> = platform.listAccounts(username, password);
    const accountsArray = [
      {
        address: 'Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf',
        nonce: '0',
        balance: '0',
      },
      {
        address: 'NcbCRXGMpHxukVmT8sirZcDnCLh1ykWp4',
        nonce: '0',
        balance: '0',
      },
    ];
    const payload:object = {
      result: {
        accounts: accountsArray,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:object = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(accountsArray);
  });
  test('getCurrentValidators 1', async () => {
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = platform.getCurrentValidators();
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
    const result:Promise<Array<object>> = platform.getCurrentValidators(subnetID);
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
    const result:Promise<Array<object>> = platform.getCurrentValidators(subnetID);
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

  test('getPendingValidators 1', async () => {
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = platform.getPendingValidators();
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

  test('getPendingValidators 2', async () => {
    const subnetID:string = 'abcdef';
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = platform.getPendingValidators(subnetID);
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

  test('getPendingValidators 3', async () => {
    const subnetID:Buffer = Buffer.from('abcdef', 'hex');
    const validators = ['val1', 'val2'];
    const result:Promise<Array<object>> = platform.getPendingValidators(subnetID);
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

  test('sampleValidators 1', async () => {
    let subnetID;
    const validators = ['val1', 'val2'];
    const result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
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
    const result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
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
    const result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
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

  test('addDefaultSubnetValidator 1', async () => {
    const id = 'abcdef';
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const stakeAmount = new BN(13);
    const payerNonce = 3;
    const destination = 'fedcba';
    const delegationFeeRate = new BN(2);
    const utx = 'valid';
    const result:Promise<string> = platform.addDefaultSubnetValidator(id, startTime, endTime, stakeAmount, payerNonce, destination, delegationFeeRate);
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

  test('addNonDefaultSubnetValidator 1', async () => {
    const id = 'abcdef';
    let subnetID;
    const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
    const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
    const weight = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
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
    const result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
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
    const result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
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
    const result:Promise<string> = platform.addDefaultSubnetDelegator(id, startTime, endTime, stakeAmount, payerNonce, destination);
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

  test('createSubnet 1', async () => {
    const controlKeys = ['abcdef'];
    const threshold = 13;
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = platform.createSubnet(controlKeys, threshold, payerNonce);
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

  test('validatedBy 1', async () => {
    const blockchainID = 'abcdef';
    const resp = 'valid';
    const result:Promise<string> = platform.validatedBy(blockchainID);
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
    const result:Promise<Array<string>> = platform.validates(subnetID);
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
    const result:Promise<Array<string>> = platform.validates(subnetID);
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
    const result:Promise<Array<string>> = platform.validates(subnetID);
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

  test('getBlockchains 1', async () => {
    const resp = [{
      id: 'nodeID',
      subnetID: 'subnetID',
      vmID: 'vmID',
    }];
    const result:Promise<Array<object>> = platform.getBlockchains();
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

  test('exportAVAX 1', async () => {
    const amount = new BN(100);
    const to = 'abcdef';
    const payerNonce = 3;
    const utx = 'valid';
    const result:Promise<string> = platform.exportAVAX(amount, to, payerNonce);
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

  test('importAVAX 1', async () => {
    const to = 'abcdef';
    const payerNonce = 3;
    const username = 'Robert';
    const password = 'Paulson';
    const tx = 'valid';
    const result:Promise<string> = platform.importAVAX(username, password, to, payerNonce);
    const payload:object = {
      result: {
        tx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(tx);
  });

  test('sign 1', async () => {
    const utx = 'abcdef';
    const signer = 'fedcba';
    const username = 'Robert';
    const password = 'Paulson';
    const tx = 'valid';
    const result:Promise<string> = platform.sign(username, password, utx, signer);
    const payload:object = {
      result: {
        tx,
      },
    };
    const responseObj = {
      data: payload,
    };

    mockAxios.mockResponse(responseObj);
    const response:string = await result;

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response).toBe(tx);
  });

  test('issueTx 1', async () => {
    const tx = 'abcdef';
    const txID = 'valid';
    const result:Promise<string> = platform.issueTx(tx);
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

  test('getSubnets 1', async () => {
    const resp: Array<object> = [{
      id: 'id',
      controlKeys: ['controlKeys'],
      threshold: 'threshold',
    }];
    const result:Promise<object> = platform.getSubnets();
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
});
