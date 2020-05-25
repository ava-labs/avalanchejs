import mockAxios from 'jest-mock-axios';


import { Slopes } from "src";
import PlatformAPI from "src/apis/platform/api";
import { Buffer } from "buffer/";
import BN from "bn.js";
import BinTools from 'src/utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe("Platform", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let username = 'AvaLabs';
    let password = 'password';

    let slopes = new Slopes(ip,port,protocol, 12345, undefined, true);
    let platform:PlatformAPI;

    beforeAll(() => {
        platform = new PlatformAPI(slopes);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("createBlockchain 1", async ()=>{
        let blockchainID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let vmID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let name:string = "Some Blockchain";
        let genesis:string = '{ruh:"roh"}';
        let result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis);
        let payload:object = {
            "result": {
                "blockchainID": blockchainID
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(blockchainID);
    });

    test("createBlockchain 2", async ()=>{
        let blockchainID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let vmID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let name:string = "Some Blockchain";
        let genesis:string = '{ruh:"roh"}';
        let subnetID:string = "abcdefg";
        let result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis, subnetID);
        let payload:object = {
            "result": {
                "blockchainID": blockchainID
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(blockchainID);
    });

    test("createBlockchain 3", async ()=>{
        let blockchainID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let vmID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let name:string = "Some Blockchain";
        let genesis:string = '{ruh:"roh"}';
        let subnetID:Buffer = Buffer.from("abcdef", "hex");
        let result:Promise<string> = platform.createBlockchain(vmID, name, 1, genesis, subnetID);
        let payload:object = {
            "result": {
                "blockchainID": blockchainID
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(blockchainID);
    });

    test("getBlockchainStatus", async ()=>{

        let blockchainID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let result:Promise<string> = platform.getBlockchainStatus(blockchainID);
        let payload:object = {
            "result": {
                "status": "Accepted"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("Accepted");
    });

    test("createAccount 1", async ()=>{

        let address = "deadbeef";
        let privateKey;
        let username = "Robert";
        let password = "Paulson";
        let result:Promise<string> = platform.createAccount(username, password, privateKey);
        let payload:object = {
            "result": {
                "address": address
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

    test("createAccount 2", async ()=>{

        let address = "deadbeef";
        let privateKey = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let result:Promise<string> = platform.createAccount(username, password, privateKey);
        let payload:object = {
            "result": {
                "address": address
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

    test("createAccount 3", async ()=>{

        let address = "deadbeef";
        let privateKey = Buffer.from("abcdef", "hex");
        let username = "Robert";
        let password = "Paulson";
        let result:Promise<string> = platform.createAccount(username, password, privateKey);
        let payload:object = {
            "result": {
                "address": address
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

    test("getAccount", async ()=>{

        let address = "deadbeef";
        let result:Promise<object> = platform.getAccount(address);
        let resultobj = {
            "address": address,
            "nonce": "0",
            "balance": "0"
        };
        let payload:object = {
            "result": resultobj
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resultobj);
    });


    test("listAccounts", async ()=>{

        let username = "Robert";
        let password = "Paulson";
        let result:Promise<object> = platform.listAccounts(username, password);
        let accountsArray = [
            {
                "address": "Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf",
                "nonce": "0",
                "balance": "0"
            },
            {
                "address": "NcbCRXGMpHxukVmT8sirZcDnCLh1ykWp4",
                "nonce": "0",
                "balance": "0"
            }
        ];
        let payload:object = {
            "result": {
                "accounts": accountsArray
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(accountsArray);
    });
    test("getCurrentValidators 1", async ()=>{

        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getCurrentValidators();
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("getCurrentValidators 2", async ()=>{
        let subnetID:string = "abcdef"
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getCurrentValidators(subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("getCurrentValidators 3", async ()=>{
        let subnetID:Buffer = Buffer.from("abcdef", "hex");
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getCurrentValidators(subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("getPendingValidators 1", async ()=>{

        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getPendingValidators();
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("getPendingValidators 2", async ()=>{
        let subnetID:string = "abcdef"
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getPendingValidators(subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("getPendingValidators 3", async ()=>{
        let subnetID:Buffer = Buffer.from("abcdef", "hex");
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.getPendingValidators(subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("sampleValidators 1", async ()=>{
        let subnetID;
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("sampleValidators 2", async ()=>{
        let subnetID = "abcdef";
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });


    test("sampleValidators 3", async ()=>{
        let subnetID = Buffer.from("abcdef", "hex");
        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.sampleValidators(10, subnetID);
        let payload:object = {
            "result": {
                "validators": validators
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    });

    test("addDefaultSubnetValidator 1", async ()=>{
        let id = "abcdef";
        let startTime = new Date(1985,5,9,12,59,43,9);
        let endTime = new Date(1982,3,1,12,58,33,7);
        let stakeAmount = new BN(13);
        let payerNonce = 3;
        let destination = "fedcba";
        let delegationFeeRate = new BN(2);
        let utx = "valid";
        let result:Promise<string> = platform.addDefaultSubnetValidator(id, startTime, endTime, stakeAmount, payerNonce, destination, delegationFeeRate);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("addNonDefaultSubnetValidator 1", async ()=>{
        let id = "abcdef";
        let subnetID;
        let startTime = new Date(1985,5,9,12,59,43,9);
        let endTime = new Date(1982,3,1,12,58,33,7);
        let weight = 13;
        let payerNonce = 3;
        let utx = "valid";
        let result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("addNonDefaultSubnetValidator 2", async ()=>{
        let id = "abcdef";
        let subnetID = "abcdef";
        let startTime = new Date(1985,5,9,12,59,43,9);
        let endTime = new Date(1982,3,1,12,58,33,7);
        let weight = 13;
        let payerNonce = 3;
        let utx = "valid";
        let result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("addNonDefaultSubnetValidator 3", async ()=>{
        let id = "abcdef";
        let subnetID = Buffer.from("abcdef", "hex");
        let startTime = new Date(1985,5,9,12,59,43,9);
        let endTime = new Date(1982,3,1,12,58,33,7);
        let weight = 13;
        let payerNonce = 3;
        let utx = "valid";
        let result:Promise<string> = platform.addNonDefaultSubnetValidator(id, subnetID, startTime, endTime, weight, payerNonce);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("addDefaultSubnetDelegator 1", async ()=>{
        let id = "abcdef";
        let startTime = new Date(1985,5,9,12,59,43,9);
        let endTime = new Date(1982,3,1,12,58,33,7);
        let stakeAmount = new BN(13);
        let payerNonce = 3;
        let destination = "fedcba";
        let utx = "valid";
        let result:Promise<string> = platform.addDefaultSubnetDelegator(id, startTime, endTime, stakeAmount, payerNonce, destination);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("createSubnet 1", async ()=>{
        let controlKeys = ["abcdef"];
        let threshold = 13;
        let payerNonce = 3;
        let utx = "valid";
        let result:Promise<string> = platform.createSubnet(controlKeys, threshold, payerNonce);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("validatedBy 1", async ()=>{
        let blockchainID = "abcdef";
        let resp = "valid";
        let result:Promise<string> = platform.validatedBy(blockchainID);
        let payload:object = {
            "result": {
                "subnetID": resp
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

    test("validates 1", async ()=>{
        let subnetID;
        let resp = ["valid"];
        let result:Promise<Array<string>> = platform.validates(subnetID);
        let payload:object = {
            "result": {
                "blockchainIDs": resp
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

    test("validates 2", async ()=>{
        let subnetID = "deadbeef";
        let resp = ["valid"];
        let result:Promise<Array<string>> = platform.validates(subnetID);
        let payload:object = {
            "result": {
                "blockchainIDs": resp
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

    test("validates 3", async ()=>{
        let subnetID = Buffer.from("abcdef", "hex");
        let resp = ["valid"];
        let result:Promise<Array<string>> = platform.validates(subnetID);
        let payload:object = {
            "result": {
                "blockchainIDs": resp
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

    test("getBlockchains 1", async ()=>{
        let resp = [{
            "id": "nodeID",
            "subnetID": "subnetID",
            "vmID": "vmID"
        }];
        let result:Promise<Array<object>> = platform.getBlockchains();
        let payload:object = {
            "result": {
                "blockchains": resp
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<object> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

    test("exportAVA 1", async ()=>{
        let amount = new BN(100);
        let to = "abcdef";
        let payerNonce = 3;
        let utx = "valid";
        let result:Promise<string> = platform.exportAVA(amount, to, payerNonce);
        let payload:object = {
            "result": {
                "unsignedTx": utx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    });

    test("importAVA 1", async ()=>{
        let to = "abcdef";
        let payerNonce = 3;
        let username = "Robert";
        let password = "Paulson";
        let tx = "valid";
        let result:Promise<string> = platform.importAVA(username, password, to, payerNonce);
        let payload:object = {
            "result": {
                "tx": tx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(tx);
    });

    test("sign 1", async ()=>{
        let utx = "abcdef";
        let signer = "fedcba";
        let username = "Robert";
        let password = "Paulson";
        let tx = "valid";
        let result:Promise<string> = platform.sign(username, password, utx, signer);
        let payload:object = {
            "result": {
                "tx": tx
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(tx);
    });

    test("issueTx 1", async ()=>{
        let tx = "abcdef";
        let txID = "valid";
        let result:Promise<string> = platform.issueTx(tx);
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

    test("getSubnets 1", async ()=>{
        let resp: object[] = [{
            "id": "id",
            "controlKeys": ["controlKeys"],
            "threshold": "threshold"
        }];
        let result:Promise<object> = platform.getSubnets();
        let payload:object = {
            "result": resp
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    });

});