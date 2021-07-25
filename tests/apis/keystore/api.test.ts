import mockAxios from "jest-mock-axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Avalanche } from "src"
import { KeystoreAPI } from "../../../src/apis/keystore/api"

describe("Keystore", (): void => {
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"

  const username: string = "AvaLabs"
  const password: string = "password"

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
  let keystore: KeystoreAPI

  beforeAll((): void => {
    keystore = new KeystoreAPI(avalanche)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("createUser", async (): Promise<void> => {
    const result: Promise<boolean> = keystore.createUser(username, password)
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

  test("createUser with weak password", async (): Promise<void> => {
    const result: Promise<boolean> = keystore.createUser(username, "aaa")
    const message: string = "password is too weak"
    const payload: object = {
      result: {
        code: -32000,
        message,
        data: null
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: boolean = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["code"]).toBe(-32000)
    expect(response["message"]).toBe(message)
  })

  test("deleteUser", async (): Promise<void> => {
    const result: Promise<boolean> = keystore.deleteUser(username, password)
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

  test("exportUser", async (): Promise<void> => {
    const data: string = "data"

    const result: Promise<string> = keystore.exportUser(username, password)
    const payload: object = {
      result: {
        user: data
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(data)
  })

  test("importUser", async (): Promise<void> => {
    const result: Promise<boolean> = keystore.importUser(
      username,
      "data",
      password
    )
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

  test("listUsers", async (): Promise<void> => {
    const accounts: string[] = ["acc1", "acc2"]

    const result: Promise<string[]> = keystore.listUsers()
    const payload: object = {
      result: {
        users: accounts
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string[] = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(accounts)
  })
})
