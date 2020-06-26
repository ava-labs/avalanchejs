import mockAxios from 'jest-mock-axios';
import { Avalanche } from "src";
import MetricsAPI from "../../../src/apis/metrics/api";

describe("Metrics", () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";

    let avalanche = new Avalanche(ip,port,protocol, 12345, undefined, true);
    let metrics:MetricsAPI;

    beforeAll(() => {
        metrics = new MetricsAPI(avalanche);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    test("getMetrics", async ()=>{
        let result:Promise<string> = metrics.getMetrics();
        let payload:string = `
              gecko_timestamp_handler_get_failed_bucket{le="100"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="10000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="100000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+06"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+07"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+08"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+09"} 0
              gecko_timestamp_handler_get_failed_bucket{le="+Inf"} 0
        `;
        let responseObj = {
            data: payload
        };

        mockAxios.mockResponse(responseObj);
        let response:string = await result;

        expect(mockAxios.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(payload);
    });
});