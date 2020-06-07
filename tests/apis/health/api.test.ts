import mockAxios from 'jest-mock-axios';


import { Slopes } from "src";
import PlatformAPI from "src/apis/platform/api";
import { Buffer } from "buffer/";
import BN from "bn.js";
import BinTools from 'src/utils/bintools';
import HealthAPI from "../../../src/apis/health/api";

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

describe("Health", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let slopes = new Slopes(ip,port,protocol, 12345, undefined, true);
    let health:HealthAPI;

    beforeAll(() => {
        health = new HealthAPI(slopes);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("getLiveness ", async ()=>{
        let result:Promise<object> = health.getLiveness();
        let payload:object = {
            "result": {
                "checks":{
                    "network.validators.heartbeat":{
                        "message":{
                            "heartbeat":1591041377
                        },
                        "timestamp":"2020-06-01T15:56:18.554202-04:00",
                        "duration":23201,
                        "contiguousFailures":0,
                        "timeOfFirstFailure":null
                    }
                },
                "healthy":true
            }
        };
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:object = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(payload['result']);
    });
});