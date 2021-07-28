import mockAxios from "jest-mock-axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { Avalanche } from "src"
import { AuthAPI } from "../../../src/apis/auth/api"
import { ErrorResponseObject } from "../../../src/utils/errors"

describe("Auth", (): void => {
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
  let auth: AuthAPI

  // We think we're a Rick, but we're totally a Jerry.
  let password: string =
    "Weddings are basically funerals with a cake. -- Rich Sanchez"
  let newPassword: string =
    "Sometimes science is more art than science, Morty. -- Rich Sanchez"
  let testToken: string =
    "To live is to risk it all otherwise you're just an inert chunk of randomly assembled molecules drifting wherever the universe blows you. -- Rick Sanchez"
  let testEndpoints: string[] = ["/ext/opt/bin/bash/foo", "/dev/null", "/tmp"]

  beforeAll((): void => {
    auth = avalanche.Auth()
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("newToken", async (): Promise<void> => {
    const result: Promise<string | ErrorResponseObject> = auth.newToken(
      password,
      testEndpoints
    )
    const payload: object = {
      result: {
        token: testToken
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string | ErrorResponseObject = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(testToken)
  })

  test("revokeToken", async (): Promise<void> => {
    const result: Promise<boolean> = auth.revokeToken(password, testToken)
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

  test("changePassword", async (): Promise<void> => {
    const result: Promise<boolean> = auth.changePassword(password, newPassword)
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
    expect(response).toBe(false)
  })
})
