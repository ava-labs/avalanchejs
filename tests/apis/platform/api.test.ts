import mockAxios from 'jest-mock-axios';


import { Slopes } from "src";
import PlatformAPI from "src/apis/platform/api";

describe("Platform", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let username = 'AvaLabs';
    let password = 'password';

    let slopes = new Slopes(ip,port,protocol, 49, undefined, true);
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

    test("createBlockchain", async ()=>{
        let blockchainID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let vmID:string = "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh";
        let name:string = "Some Blockchain";
        let method:string = 'avm.Booyashakalah';
        let genesis:object = {ruh:"roh"};
        let result:Promise<string> = platform.createBlockchain(vmID, name, method, genesis);
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

    test("listValidators", async ()=>{

        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.listValidators();
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

    test("sampleValidators", async ()=>{

        let validators = ['val1', 'val2'];
        let result:Promise<Array<string>> = platform.sampleValidators(10);
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