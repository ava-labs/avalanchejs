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

    test("createUser", async ()=>{

        let result:Promise<boolean> = keystore.createUser(username, password);
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

    test('exportUser', async ()=>{
        let data = 'data';

        let result:Promise<string> = keystore.exportUser(username, password);
        let payload:object = {
            "result": {
                "user": data
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

    test('importUser', async ()=>{

        let result:Promise<boolean> = keystore.importUser(username, 'data', password);
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

    test('listUsers', async ()=>{
        let accounts = ['acc1','acc2'];

        let result:Promise<Array<string>> = keystore.listUsers();
        let payload:object = {
            "result": {
                'users': accounts
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

});