import mockAxios from "jest-mock-axios"

import { Avalanche } from "src"
import { HealthAPI } from "../../../src/apis/health/api"
import { HealthResponse } from "../../../src/apis/health/interfaces"
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

  test("health", async (): Promise<void> => {
    const result: Promise<HealthResponse> = health.health()
    const payload: any = {
      result: {
        checks: {
          C: {
            message: [Object],
            timestamp: "2021-09-29T15:31:20.274427-07:00",
            duration: 275539,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          },
          P: {
            message: [Object],
            timestamp: "2021-09-29T15:31:20.274508-07:00",
            duration: 14576,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          },
          X: {
            message: [Object],
            timestamp: "2021-09-29T15:31:20.274529-07:00",
            duration: 4563,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          },
          isBootstrapped: {
            timestamp: "2021-09-29T15:31:19.448314-07:00",
            duration: 392,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          },
          network: {
            message: [Object],
            timestamp: "2021-09-29T15:31:19.448311-07:00",
            duration: 4866,
            contiguousFailures: 0,
            timeOfFirstFailure: null
          },
          router: {
            message: [Object],
            timestamp: "2021-09-29T15:31:19.448452-07:00",
            duration: 3932,
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
