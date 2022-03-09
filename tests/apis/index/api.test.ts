import mockAxios from "jest-mock-axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Avalanche } from "src"
import { IsAcceptedResponse } from "src/apis/index/interfaces"
import { IndexAPI } from "../../../src/apis/index/api"

describe("Index", () => {
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"

  const avalanche: Avalanche = new Avalanche(ip, port, protocol, 12345)
  let index: IndexAPI

  const id: string = "6fXf5hncR8LXvwtM8iezFQBpK5cubV6y1dWgpJCcNyzGB1EzY"
  const bytes: string =
    "111115HRzXVDSeonLBcv6QdJkQFjPzPEobMWy7PyGuoheggsMCx73MVXZo2hJMEXXvR5gFFasTRJH36aVkLiWHtTTFcghyFTqjaHnBhdXTRiLaYcro3jpseqLAFVn3ngnAB47nebQiBBKmg3nFWKzQUDxMuE6uDGXgnGouDSaEKZxfKreoLHYNUxH56rgi5c8gKFYSDi8AWBgy26siwAWj6V8EgFnPVgm9pmKCfXio6BP7Bua4vrupoX8jRGqdrdkN12dqGAibJ78Rf44SSUXhEvJtPxAzjEGfiTyAm5BWFqPdheKN72HyrBBtwC6y7wG6suHngZ1PMBh93Ubkbt8jjjGoEgs5NjpasJpE8YA9ZMLTPeNZ6ELFxV99zA46wvkjAwYHGzegBXvzGU5pGPbg28iW3iKhLoYAnReysY4x3fBhjPBsags37Z9P3SqioVifVX4wwzxYqbV72u1AWZ4JNmsnhVDP196Gu99QTzmySGTVGP5ABNdZrngTRfmGTFCRbt9CHsgNbhgetkxbsEG7tySi3gFxMzGuJ2Npk2gnSr68LgtYdSHf48Ns"
  const timestamp: string = "2021-04-02T15:34:00.262979-07:00"
  const idx: string = "0"

  beforeAll(() => {
    index = avalanche.Index()
  })

  afterEach(() => {
    mockAxios.reset()
  })

  test("getLastAccepted", async () => {
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const respobj = {
      id,
      bytes,
      timestamp,
      encoding,
      idx
    }
    const result: Promise<object> = index.getLastAccepted(encoding, baseurl)

    const payload: object = {
      result: respobj
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj))
  })

  test("getContainerByIndex", async () => {
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const respobj = {
      id,
      bytes,
      timestamp,
      encoding,
      idx
    }
    const result: Promise<object> = index.getContainerByIndex(
      idx,
      encoding,
      baseurl
    )

    const payload: object = {
      result: respobj
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj))
  })

  test("getContainerByID", async () => {
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const respobj = {
      id,
      bytes,
      timestamp,
      encoding,
      idx
    }
    const result: Promise<object> = index.getContainerByIndex(
      id,
      encoding,
      baseurl
    )

    const payload: object = {
      result: respobj
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj))
  })

  test("getContainerRange", async () => {
    const startIndex: number = 0
    const numToFetch: number = 100
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const respobj = {
      id,
      bytes,
      timestamp,
      encoding,
      idx
    }
    const result: Promise<object[]> = index.getContainerRange(
      startIndex,
      numToFetch,
      encoding,
      baseurl
    )

    const payload: object = {
      result: respobj
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj))
  })

  test("getIndex", async () => {
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const result: Promise<string> = index.getIndex(id, encoding, baseurl)

    const payload: object = {
      result: {
        index: "0"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0")
  })

  test("isAccepted", async () => {
    const encoding: string = "hex"
    const baseurl: string = "/ext/index/X/tx"
    const result: Promise<IsAcceptedResponse> = index.isAccepted(
      id,
      encoding,
      baseurl
    )

    const payload: object = {
      result: true
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: IsAcceptedResponse = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(true)
  })
})
