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

    test("addStaker", async ()=>{

        let result:Promise<boolean> = platform.addStaker('txId');
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


    test("sampleValidators 1", async ()=>{
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
});