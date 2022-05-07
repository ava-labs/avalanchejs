import mockAxios from "jest-mock-axios"
import { Avalanche, AvalancheCore } from "../src"
import { AVMAPI } from "../src/apis/avm/api"
import { AdminAPI } from "../src/apis/admin/api"
import { HealthAPI } from "../src/apis/health/api"
import { InfoAPI } from "../src/apis/info/api"
import { KeystoreAPI } from "../src/apis/keystore/api"
import { MetricsAPI } from "../src/apis/metrics/api"
import { PlatformVMAPI } from "../src/apis/platformvm/api"
import { TestAPI } from "./testlib"
import { AxiosRequestConfig } from "axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"

describe("Avalanche", (): void => {
  const blockchainID: string =
    "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF"
  let host: string = "127.0.0.1"
  const port: number = 9650
  const networkID: number = 1337
  let protocol: string = "https"
  let avalanche: Avalanche
  let avalancheCore: AvalancheCore
  const api: string = "api.avax.network"
  const url: string = "https://api.avax.network:9650"
  const encrypted: string = "https"
  const skipinit: boolean = true
  beforeAll((): void => {
    avalanche = new Avalanche(
      host,
      port,
      protocol,
      networkID,
      undefined,
      undefined,
      undefined,
      skipinit
    )
    avalanche.addAPI("admin", AdminAPI)
    avalanche.addAPI("xchain", AVMAPI, "/ext/subnet/avm", blockchainID)
    avalanche.addAPI("health", HealthAPI)
    avalanche.addAPI("info", InfoAPI)
    avalanche.addAPI("keystore", KeystoreAPI)
    avalanche.addAPI("metrics", MetricsAPI)
    avalanche.addAPI("pchain", PlatformVMAPI)
  })
  test("Remove special characters", (): void => {
    host = "a&&&&p#i,.@a+v(a)x$.~n%e't:w*o?r<k>"
    protocol = "h@t&@&@t#p+s()$"
    avalanche = new Avalanche(host, port, protocol, networkID)
    expect(avalanche.getHost()).toBe(api)
    expect(avalanche.getProtocol()).toBe(encrypted)
    expect(avalanche.getURL()).toBe(url)
    avalancheCore = new AvalancheCore(host, port, protocol)
    expect(avalancheCore.getHost()).toBe(api)
    expect(avalancheCore.getProtocol()).toBe(encrypted)
    expect(avalancheCore.getURL()).toBe(url)
  })
  test("Can specify base endpoint", (): void => {
    avalanche = new Avalanche()
    avalanche.setAddress(api, port, encrypted, "rpc")
    avalanche.setNetworkID(networkID)
    expect(avalanche.getHost()).toBe(api)
    expect(avalanche.getProtocol()).toBe(encrypted)
    expect(avalanche.getPort()).toBe(port)
    expect(avalanche.getBaseEndpoint()).toBe("rpc")
    expect(avalanche.getURL()).toBe(`${url}/rpc`)
    expect(avalanche.getNetworkID()).toBe(networkID)
  })
  test("Can initialize without port", (): void => {
    protocol = encrypted
    host = api
    avalanche = new Avalanche(host, undefined, protocol, networkID)
    expect(avalanche.getPort()).toBe(undefined)
    expect(avalanche.getURL()).toBe(`${protocol}://${api}`)
    avalancheCore = new AvalancheCore(host, undefined, protocol)
    expect(avalancheCore.getPort()).toBe(undefined)
    expect(avalancheCore.getURL()).toBe(`${protocol}://${api}`)
  })
  test("Can initialize with port", (): void => {
    protocol = encrypted
    avalanche = new Avalanche(host, port, protocol, networkID)
    expect(avalanche.getIP()).toBe(host)
    expect(avalanche.getHost()).toBe(host)
    expect(avalanche.getPort()).toBe(port)
    expect(avalanche.getProtocol()).toBe(protocol)
    expect(avalanche.getURL()).toBe(`${protocol}://${host}:${port}`)
    expect(avalanche.getNetworkID()).toBe(1337)
    expect(avalanche.getHeaders()).toStrictEqual({})
    avalanche.setNetworkID(50)
    expect(avalanche.getNetworkID()).toBe(50)
    avalanche.setNetworkID(12345)
    expect(avalanche.getNetworkID()).toBe(12345)
  })

  test("Endpoints correct", (): void => {
    expect(avalanche.Admin()).not.toBeInstanceOf(AVMAPI)
    expect(avalanche.Admin()).toBeInstanceOf(AdminAPI)

    expect(avalanche.XChain()).not.toBeInstanceOf(AdminAPI)
    expect(avalanche.XChain()).toBeInstanceOf(AVMAPI)

    expect(avalanche.Health()).not.toBeInstanceOf(KeystoreAPI)
    expect(avalanche.Health()).toBeInstanceOf(HealthAPI)

    expect(avalanche.Info()).not.toBeInstanceOf(KeystoreAPI)
    expect(avalanche.Info()).toBeInstanceOf(InfoAPI)

    expect(avalanche.PChain()).not.toBeInstanceOf(KeystoreAPI)
    expect(avalanche.PChain()).toBeInstanceOf(PlatformVMAPI)

    expect(avalanche.NodeKeys()).not.toBeInstanceOf(PlatformVMAPI)
    expect(avalanche.NodeKeys()).toBeInstanceOf(KeystoreAPI)

    expect(avalanche.Metrics()).not.toBeInstanceOf(KeystoreAPI)
    expect(avalanche.Metrics()).toBeInstanceOf(MetricsAPI)

    expect(avalanche.Admin().getRPCID()).toBe(1)
    expect(avalanche.XChain().getRPCID()).toBe(1)
    expect(avalanche.PChain().getRPCID()).toBe(1)
    expect(avalanche.NodeKeys().getRPCID()).toBe(1)
  })

  test("Create new API", (): void => {
    avalanche.addAPI("avm2", AVMAPI)
    expect(avalanche.api("avm2")).toBeInstanceOf(AVMAPI)

    avalanche.addAPI("keystore2", KeystoreAPI, "/ext/keystore2")
    expect(avalanche.api("keystore2")).toBeInstanceOf(KeystoreAPI)

    avalanche.api("keystore2").setBaseURL("/ext/keystore3")
    expect(avalanche.api("keystore2").getBaseURL()).toBe("/ext/keystore3")

    expect(avalanche.api("keystore2").getDB()).toHaveProperty("namespace")
  })

  test("Customize headers", (): void => {
    avalanche.setHeader("X-Custom-Header", "example")
    avalanche.setHeader("X-Foo", "Foo")
    avalanche.setHeader("X-Bar", "Bar")
    expect(avalanche.getHeaders()).toStrictEqual({
      "X-Custom-Header": "example",
      "X-Foo": "Foo",
      "X-Bar": "Bar"
    })
    avalanche.removeHeader("X-Foo")
    expect(avalanche.getHeaders()).toStrictEqual({
      "X-Custom-Header": "example",
      "X-Bar": "Bar"
    })
    avalanche.removeAllHeaders()
    expect(avalanche.getHeaders()).toStrictEqual({})
  })

  test("Customize request config", (): void => {
    expect(avalanche.getRequestConfig()).toStrictEqual({})
    avalanche.setRequestConfig("withCredentials", true)
    avalanche.setRequestConfig("withFoo", "Foo")
    avalanche.setRequestConfig("withBar", "Bar")
    expect(avalanche.getRequestConfig()).toStrictEqual({
      withCredentials: true,
      withFoo: "Foo",
      withBar: "Bar"
    })
    avalanche.removeRequestConfig("withFoo")
    expect(avalanche.getRequestConfig()).toStrictEqual({
      withCredentials: true,
      withBar: "Bar"
    })
    avalanche.removeAllRequestConfigs()
    expect(avalanche.getRequestConfig()).toStrictEqual({})
  })
})

describe("HTTP Operations", (): void => {
  const host: string = "127.0.0.1"
  const port: number = 8080
  const protocol: string = "http"
  const path: string = "/ext/testingrequests"
  let avalanche: Avalanche
  beforeAll((): void => {
    avalanche = new Avalanche(
      host,
      port,
      protocol,
      12345,
      undefined,
      undefined,
      undefined,
      true
    )
    avalanche.addAPI("testingrequests", TestAPI, path)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("GET works", async (): Promise<void> => {
    const input: string = "TestGET"
    const api: TestAPI = avalanche.api("testingrequests")
    const result: Promise<object> = api.TestGET(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("DELETE works", async (): Promise<void> => {
    const input: string = "TestDELETE"
    const api: TestAPI = avalanche.api("testingrequests")
    const axiosConfig: AxiosRequestConfig = {
      baseURL: `${protocol}://${host}:${port}`,
      responseType: "text"
    }
    const result: Promise<object> = api.TestDELETE(
      input,
      `/${input}`,
      axiosConfig
    )
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("POST works", async (): Promise<void> => {
    const input: string = "TestPOST"
    const api: TestAPI = avalanche.api("testingrequests")
    const result: Promise<object> = api.TestPOST(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("PUT works", async (): Promise<void> => {
    const input: string = "TestPUT"
    const api: TestAPI = avalanche.api("testingrequests")
    const result: Promise<object> = api.TestPUT(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("PATCH works", async (): Promise<void> => {
    const input: string = "TestPATCH"
    const api: TestAPI = avalanche.api("testingrequests")
    const result: Promise<object> = api.TestPATCH(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })
})
