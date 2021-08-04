import mockAxios from "jest-mock-axios"

import { Avalanche } from "src"
import { HealthAPI } from "../../../src/apis/health/api"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"

describe("Health", (): void => {
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
  let health: HealthAPI

  beforeAll((): void => {
    health = new HealthAPI(avalanche)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("getLiveness ", async (): Promise<void> => {
    const result: Promise<object> = health.getLiveness()
    const payload: any = {
      result: {
        checks: {
          "network.validators.heartbeat": {
            message: {
              heartbeat: 1591041377
            },
            timestamp: "2020-06-01T15:56:18.554202-04:00",
            duration: 23201,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          }
        },
        healthy: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: any = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(payload.result)
  })
})
