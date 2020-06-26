import mockAxios from 'jest-mock-axios';
import { Avalanche } from "src";
import InfoAPI from "src/apis/info/api";
describe("Info", () => {
    const ip:string = '127.0.0.1';
    const port:number = 9650;
    const protocol:string = "https";

    let avalanche:Avalanche = new Avalanche(ip,port,protocol, 12345, "What is my purpose? You pass butter. Oh my god.", false);
    let info:InfoAPI;

    beforeAll(() => {
        info = avalanche.Info();
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("getBlockchainID", async ()=>{
        let result:Promise<string> = info.getBlockchainID('avm');
        let payload:object = {
            "result": {
                "blockchainID": avalanche.AVM().getBlockchainID()
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("What is my purpose? You pass butter. Oh my god.");
    });

    test("getNetworkID", async ()=>{
        let result:Promise<number> = info.getNetworkID();
        let payload:object = {
            "result": {
                "networkID": 12345
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:number = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(12345);
    });

    test("getNetworkName", async ()=>{
        let result:Promise<string> = info.getNetworkName();
        let payload:object = {
            "result": {
                "networkName": "denali"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("denali");
    });

    test("getNodeID", async ()=>{
        let result:Promise<string> = info.getNodeID();
        let payload:object = {
            "result": {
                "nodeID": "abcd"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("abcd");
    });

    test("getNodeVersion", async ()=>{
        let result:Promise<string> = info.getNodeVersion();
        let payload:object = {
            "result": {
                "version": "avalanche/0.5.5"
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe("avalanche/0.5.5");
    });

    test("peers", async ()=>{
        let peers = ['p1', 'p2'];
        let result:Promise<Array<string>> = info.peers();
        let payload:object = {
            "result": {
                "peers": peers
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:Array<string> = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(peers);
    });
});