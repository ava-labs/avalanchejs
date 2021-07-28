import mockAxios from "jest-mock-axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Avalanche } from "src"
import { MetricsAPI } from "../../../src/apis/metrics/api"

describe("Metrics", (): void => {
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"

  const avalanche: Avalanche = new Avalanche(
    ip,
    port,
    protocol,
    12345,
    undefined,
    undefined,
    undefined,
    true
  )
  let metrics: MetricsAPI

  beforeAll((): void => {
    metrics = new MetricsAPI(avalanche)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("getMetrics", async (): Promise<void> => {
    const result: Promise<string> = metrics.getMetrics()
    const payload: string = `
              gecko_timestamp_handler_get_failed_bucket{le="100"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="10000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="100000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+06"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+07"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+08"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+09"} 0
              gecko_timestamp_handler_get_failed_bucket{le="+Inf"} 0
        `
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(payload)
  })
})
