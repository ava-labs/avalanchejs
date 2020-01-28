import mockAxios from 'jest-mock-axios';


import { Slopes } from "src";
import AdminAPI from "src/apis/admin/api";
describe("Admin", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let username = 'AvaLabs';
    let password = 'password';

    let slopes:Slopes = new Slopes(ip,port,protocol, 49, true);
    let admin:AdminAPI;

    beforeAll(() => {
        admin = new AdminAPI(slopes);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("lockProfile", async ()=>{
        let result:Promise<boolean> = admin.lockProfile('filename');
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

    test("memoryProfile", async ()=>{
        let result:Promise<boolean> = admin.memoryProfile('filename');
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

    test("peers", async ()=>{
        let peers = ['p1', 'p2'];
        let result:Promise<Array<string>> = admin.peers();
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

    test("startCPUProfiler", async ()=>{
        let result:Promise<boolean> = admin.startCPUProfiler('filename');
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

    test("stopCPUProfiler", async ()=>{
        let result:Promise<boolean> = admin.stopCPUProfiler();
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
});