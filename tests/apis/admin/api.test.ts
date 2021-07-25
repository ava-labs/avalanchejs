import mockAxios from "jest-mock-axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Avalanche } from "src"
import { AdminAPI } from "../../../src/apis/admin/api"

describe("Admin", (): void => {
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"
  const avalanche: Avalanche = new Avalanche(
    ip,
    port,
    protocol,
    12345,
    "What is my purpose? You pass butter. Oh my god.",
    undefined,
    undefined,
    false
  )
  let admin: AdminAPI

  beforeAll((): void => {
    admin = avalanche.Admin()
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("alias", async (): Promise<void> => {
    const ep: string = "/ext/something"
    const al: string = "/ext/anotherthing"
    const result: Promise<boolean> = admin.alias(ep, al)
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })

  test("aliasChain", async (): Promise<void> => {
    const ch: string = "abcd"
    const al: string = "myChain"
    const result: Promise<boolean> = admin.aliasChain(ch, al)
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })

  test("badAliasChain", async (): Promise<void> => {
    const ch: any = 2
    const al: string = "myChasdfasdfasain"
    const result: Promise<boolean> = admin.aliasChain(ch, al)
    const payload: object = {
      result: {
        success: false
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["success"]).toBe(false)
  })

  test("getChainAliases", async (): Promise<void> => {
    const ch: string = "chain"
    const result: Promise<string[]> = admin.getChainAliases(ch)
    const payload: object = {
      result: {
        aliases: ["alias1", "alias2"]
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string[] = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    // @ts-ignore
    expect(response).toBe(payload.result.aliases)
  })

  test("lockProfile", async () => {
    const result: Promise<boolean> = admin.lockProfile()
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })

  test("memoryProfile", async (): Promise<void> => {
    const result: Promise<boolean> = admin.memoryProfile()
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })

  test("startCPUProfiler", async (): Promise<void> => {
    const result: Promise<boolean> = admin.startCPUProfiler()
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })

  test("stopCPUProfiler", async (): Promise<void> => {
    const result: Promise<boolean> = admin.stopCPUProfiler()
    const payload: object = {
      result: {
        success: true
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })
})
