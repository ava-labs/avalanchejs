import mockAxios from "jest-mock-axios"
import { Avalanche } from "src"
import { InfoAPI } from "../../../src/apis/info/api"
import BN from "bn.js"
import {
  PeersResponse,
  UptimeResponse
} from "../../../src/apis/info/interfaces"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"

describe("Info", (): void => {
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
  let info: InfoAPI

  beforeAll((): void => {
    info = avalanche.Info()
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("getBlockchainID", async (): Promise<void> => {
    const result: Promise<string> = info.getBlockchainID("X")
    const payload: object = {
      result: {
        blockchainID: avalanche.XChain().getBlockchainID()
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("What is my purpose? You pass butter. Oh my god.")
  })

  test("getNetworkID", async (): Promise<void> => {
    const result: Promise<number> = info.getNetworkID()
    const payload: object = {
      result: {
        networkID: 12345
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: number = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(12345)
  })

  test("getTxFee", async (): Promise<void> => {
    const result: Promise<{ txFee: BN; creationTxFee: BN }> = info.getTxFee()
    const payload: object = {
      result: {
        txFee: "1000000",
        creationTxFee: "10000000"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: { txFee: BN; creationTxFee: BN } = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.txFee.eq(new BN("1000000"))).toBe(true)
    expect(response.creationTxFee.eq(new BN("10000000"))).toBe(true)
  })

  test("getNetworkName", async (): Promise<void> => {
    const result: Promise<string> = info.getNetworkName()
    const payload: object = {
      result: {
        networkName: "denali"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("denali")
  })

  test("getNodeID", async (): Promise<void> => {
    const result: Promise<string> = info.getNodeID()
    const payload: object = {
      result: {
        nodeID: "abcd"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("abcd")
  })

  test("getNodeVersion", async (): Promise<void> => {
    const result: Promise<string> = info.getNodeVersion()
    const payload: object = {
      result: {
        version: "avalanche/0.5.5"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("avalanche/0.5.5")
  })

  test("isBootstrapped false", async (): Promise<void> => {
    const result: Promise<boolean> = info.isBootstrapped("X")
    const payload: object = {
      result: {
        isBootstrapped: false
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(false)
  })

  test("isBootstrapped true", async (): Promise<void> => {
    const result: Promise<boolean> = info.isBootstrapped("P")
    const payload: object = {
      result: {
        isBootstrapped: true
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

  test("peers", async (): Promise<void> => {
    const peers = [
      {
        ip: "127.0.0.1:60300",
        publicIP: "127.0.0.1:9659",
        nodeID: "NodeID-P7oB2McjBGgW2NXXWVYjV8JEDFoW9xDE5",
        version: "avalanche/1.3.2",
        lastSent: "2021-04-14T08:15:06-07:00",
        lastReceived: "2021-04-14T08:15:06-07:00",
        benched: null
      },
      {
        ip: "127.0.0.1:60302",
        publicIP: "127.0.0.1:9655",
        nodeID: "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN",
        version: "avalanche/1.3.2",
        lastSent: "2021-04-14T08:15:06-07:00",
        lastReceived: "2021-04-14T08:15:06-07:00",
        benched: null
      }
    ]
    const result: Promise<PeersResponse[]> = info.peers()
    const payload: object = {
      result: {
        peers
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: PeersResponse[] = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(peers)
  })

  test("uptime", async (): Promise<void> => {
    const result: Promise<UptimeResponse> = info.uptime()
    const uptimeResponse: UptimeResponse = {
      rewardingStakePercentage: "100.0000",
      weightedAveragePercentage: "99.2000"
    }
    const payload: object = {
      result: uptimeResponse
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: UptimeResponse = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toEqual(uptimeResponse)
  })
})
