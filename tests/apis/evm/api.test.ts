import mockAxios from "jest-mock-axios"
import { Avalanche, BN } from "src"
import { EVMAPI } from "../../../src/apis/evm/api"
import BinTools from "../../../src/utils/bintools"
import * as bech32 from "bech32"
import { Defaults } from "../../../src/utils/constants"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import { BlockParameter } from "src/apis/evm/interfaces"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("EVMAPI", (): void => {
  const networkID: number = 12345
  const blockchainID: string = Defaults.network[networkID].C.blockchainID
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"
  const username: string = "AvaLabs"
  const password: string = "password"

  const to: string = "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7"
  const tag: BlockParameter = "latest"
  const data: string = "0xc92aecc4"

  const avalanche: Avalanche = new Avalanche(
    ip,
    port,
    protocol,
    networkID,
    undefined,
    undefined,
    undefined,
    true
  )
  let api: EVMAPI

  const addrA: string =
    "C-" +
    bech32.bech32.encode(
      avalanche.getHRP(),
      bech32.bech32.toWords(
        bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")
      )
    )
  const addrC: string =
    "C-" +
    bech32.bech32.encode(
      avalanche.getHRP(),
      bech32.bech32.toWords(
        bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
      )
    )

  beforeAll((): void => {
    api = new EVMAPI(avalanche, "/ext/bc/C/avax", blockchainID)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("importKey", async (): Promise<void> => {
    const address: string = addrC

    const result: Promise<string> = api.importKey(username, password, "key")
    const payload: object = {
      result: {
        address
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(address)
  })

  test("fail to import because no user created", async (): Promise<void> => {
    const badUserName = "zzzzzzzzzzzzzz"
    const message: string = `problem retrieving data: rpc error: code = Unknown desc = incorrect password for user "${badUserName}`

    const result: Promise<string> = api.importKey(badUserName, password, "key")
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
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["code"]).toBe(-32000)
    expect(response["message"]).toBe(message)
  })

  test("exportKey", async (): Promise<void> => {
    const key: string =
      "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
    const privateKeyHex: string =
      "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
    const object: object = { privateKey: key, privateKeyHex }

    const result: Promise<object> = api.exportKey(username, password, addrA)
    const payload: object = {
      result: {
        privateKey: key,
        privateKeyHex
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toEqual(object)
  })

  test("exportAVAX", async (): Promise<void> => {
    let amount: BN = new BN(100)
    let to: string = "abcdef"
    let username: string = "Robert"
    let password: string = "Paulson"
    let txID: string = "valid"
    let result: Promise<string> = api.exportAVAX(username, password, to, amount)
    let payload: object = {
      result: {
        txID: txID
      }
    }
    let responseObj = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    let response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("export", async (): Promise<void> => {
    let amount: BN = new BN(100)
    let to: string = "abcdef"
    let assetID: string = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
    let username: string = "Robert"
    let password: string = "Paulson"
    let txID: string = "valid"
    let result: Promise<string> = api.export(
      username,
      password,
      to,
      amount,
      assetID
    )
    let payload: object = {
      result: {
        txID: txID
      }
    }
    let responseObj = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    let response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("importAVAX", async (): Promise<void> => {
    let to: string = "abcdef"
    let username: string = "Robert"
    let password: string = "Paulson"
    let txID: string = "valid"
    let result: Promise<string> = api.importAVAX(
      username,
      password,
      to,
      blockchainID
    )
    let payload: object = {
      result: {
        txID: txID
      }
    }
    let responseObj = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    let response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("import", async (): Promise<void> => {
    let to: string = "abcdef"
    let username: string = "Robert"
    let password: string = "Paulson"
    let txID: string = "valid"
    let result: Promise<string> = api.import(
      username,
      password,
      to,
      blockchainID
    )
    let payload: object = {
      result: {
        txID: txID
      }
    }
    let responseObj = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    let response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("refreshBlockchainID", async (): Promise<void> => {
    const n5bcID: string = Defaults.network[5].C["blockchainID"]
    const n12345bcID: string = Defaults.network[12345].C["blockchainID"]
    const testAPI: EVMAPI = new EVMAPI(avalanche, "/ext/bc/C/avax", n5bcID)
    const bc1: string = testAPI.getBlockchainID()
    expect(bc1).toBe(n5bcID)

    let res: boolean = testAPI.refreshBlockchainID()
    expect(res).toBeTruthy()
    const bc2: string = testAPI.getBlockchainID()
    expect(bc2).toBe(n12345bcID)

    res = testAPI.refreshBlockchainID(n5bcID)
    expect(res).toBeTruthy()
    const bc3: string = testAPI.getBlockchainID()
    expect(bc3).toBe(n5bcID)
  })

  test("getAssetBalance", async (): Promise<void> => {
    const address: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
    const hexStr: string = "0x0"
    const blockHeight: string = hexStr
    const assetID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"

    const result: Promise<object> = api.getAssetBalance(
      address,
      blockHeight,
      assetID
    )
    const payload: object = {
      result: hexStr
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["result"]).toBe(hexStr)
  })

  test("getAvaxBalance", async (): Promise<void> => {
    const address: string = "0x9632a79656af553F58738B0FB750320158495942"
    const tag: BlockParameter = "latest"
    const hexStr: string = "0x0"

    const result: Promise<string> = api.getAvaxBalance(address, tag)
    const payload: object = {
      result: hexStr
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(hexStr)
  })

  test("getBlockByHash", async (): Promise<void> => {
    const address: string =
      "0x14d9c2aeec20254d966a947e23eb3172ae5067e66fd4e69aecc3c9d6ff24443a"
    const bool: boolean = true

    const result: Promise<string> = api.getBlockByHash(address, bool)
    const payload: object = {
      result: null
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(null)
  })

  test("sendRawTransaction", async (): Promise<void> => {
    const rawTx: string =
      "0xf86f018534630b8a0082520894197e90f9fad81970ba7976f33cbd77088e5d7cf7880de0b6b3a764000080830150f3a076b648783e587efc207974021eb90ac96a96d28a12605688c288fd540e3dec06a0560e83ac70bafc901caa67d2e36677212ff2163451f23209c61949a6788faaa6"

    const result: Promise<string> = api.sendRawTransaction(rawTx)
    const payload: object = {
      result:
        "0xf72d312e9ed3f48bc84a56ea9fe39cc48bebede5be01d2c40a108a2b3360de2f"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(
      "0xf72d312e9ed3f48bc84a56ea9fe39cc48bebede5be01d2c40a108a2b3360de2f"
    )
  })

  test("getTransactionCount", async (): Promise<void> => {
    const address: string = "0x9632a79656af553F58738B0FB750320158495942"
    const tag: BlockParameter = "latest"
    const hexStr: string = "0x0"

    const result: Promise<string> = api.getTransactionCount(address, tag)
    const payload: object = {
      result: hexStr
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(hexStr)
  })

  test("getAssetBalance with bad assetID", async (): Promise<void> => {
    const address: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
    const hexStr: string = "0x0"
    const blockHeight: string = hexStr
    const assetID: string = "aaa"

    const message: string =
      "invalid argument 2: couldn't decode ID to bytes: input string is smaller than the checksum size"

    const result: Promise<object> = api.getAssetBalance(
      address,
      blockHeight,
      assetID
    )
    const payload: object = {
      result: {
        code: -32602,
        message
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["result"]["code"]).toBe(-32602)
    expect(response["result"]["message"]).toBe(message)
  })

  test("getAtomicTxStatus", async (): Promise<void> => {
    const txID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"

    const result: Promise<string> = api.getAtomicTxStatus(txID)
    const payload: object = {
      result: {
        status: "Accepted"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("Accepted")
  })

  test("getBaseFee", async (): Promise<void> => {
    const result: Promise<string> = api.getBaseFee()
    const payload: object = {
      result: "0x34630b8a00"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0x34630b8a00")
  })

  test("getMaxPriorityFeePerGas", async (): Promise<void> => {
    const result: Promise<string> = api.getMaxPriorityFeePerGas()
    const payload: object = {
      result: "0x2540be400"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0x2540be400")
  })

  test("getBlockNumber", async (): Promise<void> => {
    const result: Promise<string> = api.getBlockNumber()
    const payload: object = {
      result: "0x0"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0x0")
  })

  test("getEthCall", async (): Promise<void> => {
    const result: Promise<string> = api.getEthCall({ to, data }, tag)
    const payload: object = {
      result: "0x0"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0x0")
  })

  test("getEthChainID", async (): Promise<void> => {
    const result: Promise<string> = api.getEthChainID()
    const payload: object = {
      result: "0xa868"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("0xa868")
  })

  test("web3Sha3", async (): Promise<void> => {
    const result: Promise<string> = api.web3Sha3(data)
    const payload: object = {
      result:
        "0x627119bb8286874a15d562d32829613311a678da26ca7a6a785ec4ad85937d06"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(
      "0x627119bb8286874a15d562d32829613311a678da26ca7a6a785ec4ad85937d06"
    )
  })

  test("web3ClientVersion", async (): Promise<void> => {
    const result: Promise<string> = api.web3ClientVersion()
    const payload: object = {
      result: "v0.6.3"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("v0.6.3")
  })

  test("netVersion", async (): Promise<void> => {
    const result: Promise<string> = api.netVersion()
    const payload: object = {
      result: "1"
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("1")
  })

  test("getAtomicTx", async (): Promise<void> => {
    const txID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"
    const tx =
      "111119TRhWSj932BnTyhskYtn4j7dY9Nqq8wi3mmmFvHvDEoAfifMnRcUuTFqRxhsqWyXMTHmFBcSrMS6u9F6LRA1G3DmKWoA3Yb27JbhUV7ismLkiEsWJ187q2AwgE2RCVG7eZ9zL89ZBmaVA1bkzsx324LjU9NiYgkceJxm5d3L9ATiLgWt4mWMDR4YKpSv4qKqjfD2fRzYm7gX2C2F1auCvVN6Hd15J3jRUB7vKEEcBZJexdYdqnCX7vFdwoGpJM7tUiFRDgAAPpMoxz6QF7gwKbkkXK5Vg4LG2szScX9qL5BegNwUeNQYB42kF3M3w5tnVekhmHQdZSEYU8NjSnSZnqAFPcHc4StM3yZem3MTFRYJqNc7RAvoMGi8am3Hx4GVpwYqjiqev3XiqfyuTssn4bR1XaJbjQTyC"

    const result: Promise<string> = api.getAtomicTx(txID)
    const payload: object = {
      result: {
        tx,
        encoding: "cb58",
        blockHeight: 8
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(tx)
  })
})
