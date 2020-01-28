import mockAxios from 'jest-mock-axios';


import { Slopes } from "src";
import KeystoreAPI from "src/apis/keystore/api";

describe("Keystore", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let username = 'AvaLabs';
    let password = 'password';

    let slopes = new Slopes(ip,port,protocol, 49, undefined, true);
    let keystore:KeystoreAPI;

    beforeAll(() => {
        keystore = new KeystoreAPI(slopes);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("createAccount", async ()=>{

        let result:Promise<boolean> = keystore.createAccount(username, password);
        let payload:object = {
            "result": {
                "success": true
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:boolean = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    });

    test('can CreateAddress', async ()=>{
        let alias = 'randomalias';

        let result:Promise<string> = keystore.createAddress(username, password, alias);
        let payload:object = {
            "result": {
                "address": alias
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(alias);
    });


    test('exportAccount', async ()=>{
        let data = 'data';

        let result:Promise<string> = keystore.exportAccount(username, password);
        let payload:object = {
            "result": {
                "accountData": data
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(data);
    });

    test('exportKey', async ()=>{
        let key = 'sdfglvlj2h3v45';

        let result:Promise<string> = keystore.exportKey(username, password, 'alias', 'address');
        let payload:object = {
            "result": {
                "privateKey": key
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(key);
    });


    test('getAllBalances', async ()=>{
        let balances = {
            'ATH': 23,
            'BTC': 59
        };

        let result:Promise<object> = keystore.getAllBalances('alias', 'address');
        let payload:object = {
            "result": {
                "balances": balances
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(balances);
    });

    test('getBalance', async ()=>{
        let balance = 100;

        let result:Promise<number> = keystore.getBalance('alias', 'address', 'ATH');
        let payload:object = {
            "result": {
                "balance": balance
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:number = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(balance);
    });


    test('getTxHistory', async ()=>{
        let history = {};

        let result:Promise<object> = keystore.getTxHistory('alias', 'address');
        let payload:object = {
            "result": history
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(history);
    });

    test('importAccount', async ()=>{

        let result:Promise<boolean> = keystore.importAccount(username, 'data', password);
        let payload:object = {
            "result": {
                'success': true
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:boolean = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    });


    test('importKey', async ()=>{
        let address = 'asdflashdvfalsdf';

        let result:Promise<string> = keystore.importKey(username,password, 'alias', 'key');
        let payload:object = {
            "result": {
                'address': address
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(address);
    });

    test('listAccounts', async ()=>{
        let accounts = ['acc1','acc2'];

        let result:Promise<Array<string>> = keystore.listAccounts();
        let payload:object = {
            "result": {
                'accounts': accounts
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(accounts);
    });

    test('listAddresses', async ()=>{
        let addresses = ['acc1','acc2'];

        let result:Promise<Array<string>> = keystore.listAddresses(username, 'alias');
        let payload:object = {
            "result": {
                'addresses': addresses
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(addresses);
    });

    test('listAssets', async ()=>{
        let assets = ['ATH','ETH'];

        let result:Promise<Array<string>> = keystore.listAssets(username, 'address');
        let payload:object = {
            "result": {
                'assets': assets
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(assets);
    });


    test('can ListSubnets', async ()=>{
        let subnets = ['net1','net2'];

        let result:Promise<Array<string>> = keystore.listSubnets();
        let payload:object = {
            "result": {
                'subnetIDs': subnets
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(subnets);
    });

    test('can Send', async ()=>{
        let txId = 'asdfhvl234';

        let result:Promise<string> = keystore.send(username,password,'alias', 'assetId', 10, 'toAddress', ['fromAddress']);
        let payload:object = {
            "result": {
                'txID': txId
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txId);
    });





});