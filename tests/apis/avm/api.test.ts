import mockAxios from "jest-mock-axios"
import { Avalanche } from "src"
import { AVMAPI } from "../../../src/apis/avm/api"
import { KeyPair, KeyChain } from "../../../src/apis/avm/keychain"
import { Buffer } from "buffer/"
import BN from "bn.js"
import BinTools from "../../../src/utils/bintools"
import { UTXOSet, UTXO } from "../../../src/apis/avm/utxos"
import {
  TransferableInput,
  SECPTransferInput
} from "../../../src/apis/avm/inputs"
import createHash from "create-hash"
import { UnsignedTx, Tx } from "../../../src/apis/avm/tx"
import { AVMConstants } from "../../../src/apis/avm/constants"
import {
  TransferableOutput,
  SECPTransferOutput,
  NFTMintOutput,
  NFTTransferOutput,
  SECPMintOutput
} from "../../../src/apis/avm/outputs"
import {
  NFTTransferOperation,
  TransferableOperation,
  SECPMintOperation
} from "../../../src/apis/avm/ops"
import * as bech32 from "bech32"
import { UTF8Payload } from "../../../src/utils/payload"
import { InitialStates } from "../../../src/apis/avm/initialstates"
import { Defaults } from "../../../src/utils/constants"
import { UnixNow } from "../../../src/utils/helperfunctions"
import { OutputOwners } from "../../../src/common/output"
import { MinterSet } from "../../../src/apis/avm/minterset"
import { PlatformChainID } from "../../../src/utils/constants"
import { PersistanceOptions } from "../../../src/utils/persistenceoptions"
import { ONEAVAX } from "../../../src/utils/constants"
import {
  Serializable,
  Serialization,
  SerializedEncoding,
  SerializedType
} from "../../../src/utils/serialization"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"
import {
  GetBalanceResponse,
  SendMultipleResponse,
  SendResponse
} from "src/apis/avm/interfaces"
import { CENTIAVAX } from "src/utils"
import { MILLIAVAX } from "src/utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()
const dumpSerailization: boolean = false
const display: SerializedEncoding = "display"

const serialzeit = (aThing: Serializable, name: string): void => {
  if (dumpSerailization) {
    console.log(
      JSON.stringify(
        serialization.serialize(aThing, "avm", "hex", name + " -- Hex Encoded")
      )
    )
    console.log(
      JSON.stringify(
        serialization.serialize(
          aThing,
          "avm",
          "display",
          name + " -- Human-Readable"
        )
      )
    )
  }
}

describe("AVMAPI", (): void => {
  const networkID: number = 1337
  const blockchainID: string = Defaults.network[networkID].X.blockchainID
  const ip: string = "127.0.0.1"
  const port: number = 9650
  const protocol: string = "https"

  const username: string = "AvaLabs"
  const password: string = "password"

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
  let api: AVMAPI
  let alias: string

  const addrA: string = `X-${bech32.bech32.encode(
    avalanche.getHRP(),
    bech32.bech32.toWords(
      bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")
    )
  )}`
  const addrB: string = `X-${bech32.bech32.encode(
    avalanche.getHRP(),
    bech32.bech32.toWords(
      bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")
    )
  )}`
  const addrC: string = `X-${bech32.bech32.encode(
    avalanche.getHRP(),
    bech32.bech32.toWords(
      bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
    )
  )}`

  beforeAll((): void => {
    api = new AVMAPI(avalanche, "/ext/bc/X", blockchainID)
    alias = api.getBlockchainAlias()
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("fails to send with incorrect username", async (): Promise<void> => {
    const memo: string = "hello world"
    const incorrectUserName: string = "asdfasdfsa"
    const message: string = `problem retrieving user: incorrect password for user "${incorrectUserName}"`
    const result: Promise<SendResponse> = api.send(
      incorrectUserName,
      password,
      "assetId",
      10,
      addrA,
      [addrB],
      addrA,
      memo
    )

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
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["code"]).toBe(-32000)
    expect(response["message"]).toBe(message)
  })

  test("fails to send with incorrect Password", async (): Promise<void> => {
    const memo: string = "hello world"
    const incorrectPassword: string = "asdfasdfsa"
    const message: string = `problem retrieving user: incorrect password for user "${incorrectPassword}"`
    const result: Promise<SendResponse> = api.send(
      username,
      incorrectPassword,
      "assetId",
      10,
      addrA,
      [addrB],
      addrA,
      memo
    )

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
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["code"]).toBe(-32000)
    expect(response["message"]).toBe(message)
  })

  test("can Send 1", async (): Promise<void> => {
    const txId: string = "asdfhvl234"
    const memo: string = "hello world"
    const changeAddr: string = "X-local1"
    const result: Promise<SendResponse> = api.send(
      username,
      password,
      "assetId",
      10,
      addrA,
      [addrB],
      addrA,
      memo
    )
    const payload: object = {
      result: {
        txID: txId,
        changeAddr: changeAddr
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["txID"]).toBe(txId)
    expect(response["changeAddr"]).toBe(changeAddr)
  })

  test("can Send 2", async (): Promise<void> => {
    const txId: string = "asdfhvl234"
    const memo: Buffer = Buffer.from("hello world")
    const changeAddr: string = "X-local1"
    const result: Promise<SendResponse> = api.send(
      username,
      password,
      bintools.b58ToBuffer("6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF"),
      new BN(10),
      addrA,
      [addrB],
      addrA,
      memo
    )
    const payload: object = {
      result: {
        txID: txId,
        changeAddr: changeAddr
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["txID"]).toBe(txId)
    expect(response["changeAddr"]).toBe(changeAddr)
  })

  test("can Send Multiple", async (): Promise<void> => {
    const txId: string = "asdfhvl234"
    const memo: string = "hello world"
    const changeAddr: string = "X-local1"
    const result: Promise<SendMultipleResponse> = api.sendMultiple(
      username,
      password,
      [{ assetID: "assetId", amount: 10, to: addrA }],
      [addrB],
      addrA,
      memo
    )
    const payload: object = {
      result: {
        txID: txId,
        changeAddr: changeAddr
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: SendMultipleResponse = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response["txID"]).toBe(txId)
    expect(response["changeAddr"]).toBe(changeAddr)
  })

  test("refreshBlockchainID", async (): Promise<void> => {
    const n3bcID: string = Defaults.network[3].X["blockchainID"]
    const n1337bcID: string = Defaults.network[1337].X["blockchainID"]
    const testAPI: AVMAPI = new AVMAPI(avalanche, "/ext/bc/avm", n3bcID)
    const bc1: string = testAPI.getBlockchainID()
    expect(bc1).toBe(n3bcID)

    testAPI.refreshBlockchainID()
    const bc2: string = testAPI.getBlockchainID()
    expect(bc2).toBe(n1337bcID)

    testAPI.refreshBlockchainID(n3bcID)
    const bc3: string = testAPI.getBlockchainID()
    expect(bc3).toBe(n3bcID)
  })

  test("listAddresses", async (): Promise<void> => {
    const addresses = [addrA, addrB]
    const result: Promise<string[]> = api.listAddresses(username, password)
    const payload: object = {
      result: {
        addresses
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string[] = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(addresses)
  })

  test("importKey", async (): Promise<void> => {
    const address = addrC
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

  test("getBalance", async (): Promise<void> => {
    const balance: BN = new BN("100", 10)
    const respobj: GetBalanceResponse = {
      balance,
      utxoIDs: [
        {
          txID: "LUriB3W919F84LwPMMw4sm2fZ4Y76Wgb6msaauEY7i1tFNmtv",
          outputIndex: 0
        }
      ]
    }

    const result: Promise<GetBalanceResponse> = api.getBalance(addrA, "ATH")
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

  test("getBalance includePartial", async (): Promise<void> => {
    const balance: BN = new BN("100", 10)
    const respobj = {
      balance,
      utxoIDs: [
        {
          txID: "LUriB3W919F84LwPMMw4sm2fZ4Y76Wgb6msaauEY7i1tFNmtv",
          outputIndex: 0
        }
      ]
    }

    const result: Promise<GetBalanceResponse> = api.getBalance(
      addrA,
      "ATH",
      true
    )
    const payload: object = {
      result: respobj
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    const expectedRequestPayload = {
      id: 1,
      method: "avm.getBalance",
      params: {
        address: addrA,
        assetID: "ATH",
        includePartial: true
      },
      jsonrpc: "2.0"
    }

    mockAxios.mockResponse(responseObj)
    const response: object = await result
    const calledWith: object = {
      baseURL: "https://127.0.0.1:9650",
      data: '{"id":9,"method":"avm.getBalance","params":{"address":"X-custom1d6kkj0qh4wcmus3tk59npwt3rluc6en755a58g","assetID":"ATH","includePartial":true},"jsonrpc":"2.0"}',
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      method: "POST",
      params: {},
      responseType: "json",
      url: "/ext/bc/X"
    }

    expect(mockAxios.request).toBeCalledWith(calledWith)
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response)).toBe(JSON.stringify(respobj))
  })

  test("exportKey", async (): Promise<void> => {
    const key: string = "sdfglvlj2h3v45"

    const result: Promise<string> = api.exportKey(username, password, addrA)
    const payload: object = {
      result: {
        privateKey: key
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(key)
  })

  test("export", async (): Promise<void> => {
    const amount: BN = new BN(100)
    const to: string = "abcdef"
    const assetID: string = "AVAX"
    const username: string = "Robert"
    const password: string = "Paulson"
    const txID: string = "valid"
    const result: Promise<string> = api.export(
      username,
      password,
      to,
      amount,
      assetID
    )
    const payload: object = {
      result: {
        txID: txID
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("import", async (): Promise<void> => {
    const to: string = "abcdef"
    const username: string = "Robert"
    const password: string = "Paulson"
    const txID: string = "valid"
    const result: Promise<string> = api.import(
      username,
      password,
      to,
      blockchainID
    )
    const payload: object = {
      result: {
        txID: txID
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(txID)
  })

  test("createAddress", async (): Promise<void> => {
    const alias: string = "randomalias"

    const result: Promise<string> = api.createAddress(username, password)
    const payload: object = {
      result: {
        address: alias
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(alias)
  })

  test("createFixedCapAsset", async (): Promise<void> => {
    const kp: KeyPair = new KeyPair(avalanche.getHRP(), alias)
    kp.importKey(
      Buffer.from(
        "ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676",
        "hex"
      )
    )

    const denomination: number = 0
    const assetID: string =
      "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533"
    const initialHolders: object[] = [
      {
        address: "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
        amount: "10000"
      },
      {
        address: "7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh",
        amount: "50000"
      }
    ]

    const result: Promise<string> = api.createFixedCapAsset(
      username,
      password,
      "Some Coin",
      "SCC",
      denomination,
      initialHolders
    )
    const payload: object = {
      result: {
        assetID: assetID
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(assetID)
  })

  test("createVariableCapAsset", async () => {
    const kp: KeyPair = new KeyPair(avalanche.getHRP(), alias)
    kp.importKey(
      Buffer.from(
        "ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676",
        "hex"
      )
    )

    const denomination: number = 0
    const assetID: string =
      "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533"
    const minterSets: object[] = [
      {
        minters: ["4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q"],
        threshold: 1
      },
      {
        minters: [
          "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
          "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
          "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
        ],
        threshold: 2
      }
    ]

    const result: Promise<string> = api.createVariableCapAsset(
      username,
      password,
      "Some Coin",
      "SCC",
      denomination,
      minterSets
    )
    const payload: object = {
      result: {
        assetID: assetID
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe(assetID)
  })

  test("mint 1", async (): Promise<void> => {
    const username: string = "Collin"
    const password: string = "Cusce"
    const amount: number = 2
    const assetID: string =
      "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"
    const to: string = "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF"
    const minters: string[] = [
      "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
      "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
      "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
    ]
    const result: Promise<string> = api.mint(
      username,
      password,
      amount,
      assetID,
      to,
      minters
    )
    const payload: object = {
      result: {
        txID: "sometx"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("sometx")
  })

  test("mint 2", async (): Promise<void> => {
    const username: string = "Collin"
    const password: string = "Cusce"
    const amount: BN = new BN(1)
    const assetID: Buffer = Buffer.from(
      "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7",
      "hex"
    )
    const to: string = "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF"
    const minters: string[] = [
      "dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF",
      "2fE6iibqfERz5wenXE6qyvinsxDvFhHZk",
      "7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU"
    ]
    const result: Promise<string> = api.mint(
      username,
      password,
      amount,
      assetID,
      to,
      minters
    )
    const payload: object = {
      result: {
        txID: "sometx"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("sometx")
  })

  test("getTx", async (): Promise<void> => {
    const txid: string =
      "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"

    const result: Promise<string | object> = api.getTx(txid)
    const payload: object = {
      result: {
        tx: "sometx"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string | object = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("sometx")
  })

  test("getTxStatus", async (): Promise<void> => {
    const txid: string =
      "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"

    const result: Promise<string> = api.getTxStatus(txid)
    const payload: object = {
      result: {
        status: "accepted"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: string = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response).toBe("accepted")
  })

  test("getAssetDescription as string", async () => {
    const assetID: Buffer = Buffer.from(
      "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533",
      "hex"
    )
    const assetidstr: string = bintools.cb58Encode(assetID)

    const result: Promise<object> = api.getAssetDescription(assetidstr)
    const payload: object = {
      result: {
        name: "Collin Coin",
        symbol: "CKC",
        assetID: assetidstr,
        denomination: "10"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: any = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.name).toBe("Collin Coin")
    expect(response.symbol).toBe("CKC")
    expect(response.assetID.toString("hex")).toBe(assetID.toString("hex"))
    expect(response.denomination).toBe(10)
  })

  test("getAssetDescription as Buffer", async (): Promise<void> => {
    const assetID: Buffer = Buffer.from(
      "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533",
      "hex"
    )
    const assetidstr: string = bintools.cb58Encode(
      Buffer.from(
        "8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533",
        "hex"
      )
    )

    const result: Promise<object> = api.getAssetDescription(assetID)
    const payload: object = {
      result: {
        name: "Collin Coin",
        symbol: "CKC",
        assetID: assetidstr,
        denomination: "11"
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    const response: any = await result

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.name).toBe("Collin Coin")
    expect(response.symbol).toBe("CKC")
    expect(response.assetID.toString("hex")).toBe(assetID.toString("hex"))
    expect(response.denomination).toBe(11)
  })

  test("getUTXOs", async (): Promise<void> => {
    // Payment
    const OPUTXOstr1: string = bintools.cb58Encode(
      Buffer.from(
        "000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d",
        "hex"
      )
    )
    const OPUTXOstr2: string = bintools.cb58Encode(
      Buffer.from(
        "0000c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e",
        "hex"
      )
    )
    const OPUTXOstr3: string = bintools.cb58Encode(
      Buffer.from(
        "0000f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e",
        "hex"
      )
    )

    const set: UTXOSet = new UTXOSet()
    set.add(OPUTXOstr1)
    set.addArray([OPUTXOstr2, OPUTXOstr3])

    const persistOpts: PersistanceOptions = new PersistanceOptions(
      "test",
      true,
      "union"
    )
    expect(persistOpts.getMergeRule()).toBe("union")
    let addresses: string[] = set
      .getAddresses()
      .map((a) => api.addressFromBuffer(a))
    let result: Promise<{
      numFetched: number
      utxos: UTXOSet
      endIndex: { address: string; utxo: string }
    }> = api.getUTXOs(
      addresses,
      api.getBlockchainID(),
      0,
      undefined,
      persistOpts
    )
    const payload: object = {
      result: {
        numFetched: 3,
        utxos: [OPUTXOstr1, OPUTXOstr2, OPUTXOstr3],
        stopIndex: { address: "a", utxo: "b" }
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }

    mockAxios.mockResponse(responseObj)
    let response: UTXOSet = (await result).utxos

    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(
      JSON.stringify(set.getAllUTXOStrings().sort())
    )

    addresses = set.getAddresses().map((a) => api.addressFromBuffer(a))
    result = api.getUTXOs(
      addresses,
      api.getBlockchainID(),
      0,
      undefined,
      persistOpts
    )

    mockAxios.mockResponse(responseObj)
    response = (await result).utxos

    expect(mockAxios.request).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(
      JSON.stringify(set.getAllUTXOStrings().sort())
    )
  })

  describe("Transactions", (): void => {
    let set: UTXOSet
    let keymgr2: KeyChain
    let keymgr3: KeyChain
    let addrs1: string[]
    let addrs2: string[]
    let addrs3: string[]
    let addressbuffs: Buffer[] = []
    let addresses: string[] = []
    let utxos: UTXO[]
    let inputs: TransferableInput[]
    let outputs: TransferableOutput[]
    let ops: TransferableOperation[]
    let amnt: number = 10000
    const assetID: Buffer = Buffer.from(
      createHash("sha256").update("mary had a little lamb").digest()
    )
    const NFTassetID: Buffer = Buffer.from(
      createHash("sha256")
        .update(
          "I can't stand it, I know you planned it, I'mma set straight this Watergate."
        )
        .digest()
    )
    let secpbase1: SECPTransferOutput
    let secpbase2: SECPTransferOutput
    let secpbase3: SECPTransferOutput
    let initialState: InitialStates
    let nftpbase1: NFTMintOutput
    let nftpbase2: NFTMintOutput
    let nftpbase3: NFTMintOutput
    let nftInitialState: InitialStates
    let nftutxoids: string[] = []
    let fungutxoids: string[] = []
    let avm: AVMAPI
    const fee: number = 10
    const name: string = "Mortycoin is the dumb as a sack of hammers."
    const symbol: string = "morT"
    const denomination: number = 8

    let secpMintOut1: SECPMintOutput
    let secpMintOut2: SECPMintOutput
    let secpMintTXID: Buffer
    let secpMintUTXO: UTXO
    let secpMintXferOut1: SECPTransferOutput
    let secpMintXferOut2: SECPTransferOutput
    let secpMintOp: SECPMintOperation

    let xfersecpmintop: TransferableOperation

    beforeEach(async (): Promise<void> => {
      avm = new AVMAPI(avalanche, "/ext/bc/X", blockchainID)

      const result: Promise<Buffer> = avm.getAVAXAssetID(true)
      const payload: object = {
        result: {
          name,
          symbol,
          assetID: bintools.cb58Encode(assetID),
          denomination: denomination
        }
      }
      const responseObj: HttpResponse = {
        data: payload
      }

      mockAxios.mockResponse(responseObj)
      await result
      set = new UTXOSet()
      avm.newKeyChain()
      keymgr2 = new KeyChain(avalanche.getHRP(), alias)
      keymgr3 = new KeyChain(avalanche.getHRP(), alias)
      addrs1 = []
      addrs2 = []
      addrs3 = []
      utxos = []
      inputs = []
      outputs = []
      ops = []
      nftutxoids = []
      fungutxoids = []
      const pload: Buffer = Buffer.alloc(1024)
      pload.write(
        "All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.",
        0,
        1024,
        "utf8"
      )

      for (let i: number = 0; i < 3; i++) {
        addrs1.push(
          avm.addressFromBuffer(avm.keyChain().makeKey().getAddress())
        )
        addrs2.push(avm.addressFromBuffer(keymgr2.makeKey().getAddress()))
        addrs3.push(avm.addressFromBuffer(keymgr3.makeKey().getAddress()))
      }
      const amount: BN = ONEAVAX.mul(new BN(amnt))
      addressbuffs = avm.keyChain().getAddresses()
      addresses = addressbuffs.map((a) => avm.addressFromBuffer(a))
      const locktime: BN = new BN(54321)
      const threshold: number = 3
      for (let i: number = 0; i < 5; i++) {
        let txid: Buffer = Buffer.from(
          createHash("sha256")
            .update(bintools.fromBNToBuffer(new BN(i), 32))
            .digest()
        )
        let txidx: Buffer = Buffer.alloc(4)
        txidx.writeUInt32BE(i, 0)

        const out: SECPTransferOutput = new SECPTransferOutput(
          amount,
          addressbuffs,
          locktime,
          threshold
        )
        const xferout: TransferableOutput = new TransferableOutput(assetID, out)
        outputs.push(xferout)

        const u: UTXO = new UTXO()
        u.fromBuffer(
          Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()])
        )
        fungutxoids.push(u.getUTXOID())
        utxos.push(u)

        txid = u.getTxID()
        txidx = u.getOutputIdx()
        const asset = u.getAssetID()

        const input: SECPTransferInput = new SECPTransferInput(amount)
        const xferinput: TransferableInput = new TransferableInput(
          txid,
          txidx,
          asset,
          input
        )
        inputs.push(xferinput)

        const nout: NFTTransferOutput = new NFTTransferOutput(
          1000 + i,
          pload,
          addressbuffs,
          locktime,
          threshold
        )
        const op: NFTTransferOperation = new NFTTransferOperation(nout)
        const nfttxid: Buffer = Buffer.from(
          createHash("sha256")
            .update(bintools.fromBNToBuffer(new BN(1000 + i), 32))
            .digest()
        )
        const nftutxo: UTXO = new UTXO(
          AVMConstants.LATESTCODEC,
          nfttxid,
          1000 + i,
          NFTassetID,
          nout
        )
        nftutxoids.push(nftutxo.getUTXOID())
        const xferop: TransferableOperation = new TransferableOperation(
          NFTassetID,
          [nftutxo.getUTXOID()],
          op
        )
        ops.push(xferop)
        utxos.push(nftutxo)
      }
      set.addArray(utxos)

      secpbase1 = new SECPTransferOutput(
        new BN(777),
        addrs3.map((a) => avm.parseAddress(a)),
        UnixNow(),
        1
      )
      secpbase2 = new SECPTransferOutput(
        new BN(888),
        addrs2.map((a) => avm.parseAddress(a)),
        UnixNow(),
        1
      )
      secpbase3 = new SECPTransferOutput(
        new BN(999),
        addrs2.map((a) => avm.parseAddress(a)),
        UnixNow(),
        1
      )
      initialState = new InitialStates()
      initialState.addOutput(secpbase1, AVMConstants.SECPFXID)
      initialState.addOutput(secpbase2, AVMConstants.SECPFXID)
      initialState.addOutput(secpbase3, AVMConstants.SECPFXID)

      nftpbase1 = new NFTMintOutput(
        0,
        addrs1.map((a) => api.parseAddress(a)),
        locktime,
        1
      )
      nftpbase2 = new NFTMintOutput(
        1,
        addrs2.map((a) => api.parseAddress(a)),
        locktime,
        1
      )
      nftpbase3 = new NFTMintOutput(
        2,
        addrs3.map((a) => api.parseAddress(a)),
        locktime,
        1
      )
      nftInitialState = new InitialStates()
      nftInitialState.addOutput(nftpbase1, AVMConstants.NFTFXID)
      nftInitialState.addOutput(nftpbase2, AVMConstants.NFTFXID)
      nftInitialState.addOutput(nftpbase3, AVMConstants.NFTFXID)

      secpMintOut1 = new SECPMintOutput(addressbuffs, new BN(0), 1)
      secpMintOut2 = new SECPMintOutput(addressbuffs, new BN(0), 1)
      secpMintTXID = Buffer.from(
        createHash("sha256")
          .update(bintools.fromBNToBuffer(new BN(1337), 32))
          .digest()
      )
      secpMintUTXO = new UTXO(
        AVMConstants.LATESTCODEC,
        secpMintTXID,
        0,
        assetID,
        secpMintOut1
      )
      secpMintXferOut1 = new SECPTransferOutput(
        new BN(123),
        addrs3.map((a) => avm.parseAddress(a)),
        UnixNow(),
        2
      )
      secpMintXferOut2 = new SECPTransferOutput(
        new BN(456),
        [avm.parseAddress(addrs2[0])],
        UnixNow(),
        1
      )
      secpMintOp = new SECPMintOperation(secpMintOut1, secpMintXferOut1)

      set.add(secpMintUTXO)

      xfersecpmintop = new TransferableOperation(
        assetID,
        [secpMintUTXO.getUTXOID()],
        secpMintOp
      )
    })

    test("getDefaultMintTxFee", (): void => {
      expect(avm.getDefaultMintTxFee().toString()).toBe("1000000")
    })

    test("signTx", async (): Promise<void> => {
      const txu1: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )
      const txu2: UnsignedTx = set.buildBaseTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        new BN(amnt),
        assetID,
        addrs3.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        avm.getTxFee(),
        assetID,
        undefined,
        UnixNow(),
        new BN(0),
        1
      )

      const tx1: Tx = avm.signTx(txu1)
      const tx2: Tx = avm.signTx(txu2)

      expect(tx2.toBuffer().toString("hex")).toBe(
        tx1.toBuffer().toString("hex")
      )
      expect(tx2.toString()).toBe(tx1.toString())
    })

    test("buildBaseTx1", async (): Promise<void> => {
      const txu1: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1,
        new UTF8Payload("hello world").getContent()
      )
      const memobuf: Buffer = Buffer.from("hello world")
      const txu2: UnsignedTx = set.buildBaseTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        new BN(amnt),
        assetID,
        addrs3.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs1.map((a) => avm.parseAddress(a)),
        avm.getTxFee(),
        assetID,
        memobuf,
        UnixNow(),
        new BN(0),
        1
      )
      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
    })

    test("xssPreventionObject", async (): Promise<void> => {
      const txu1: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )

      const tx1: Tx = avm.signTx(txu1)
      const tx1obj: object = tx1.serialize("hex")
      const sanitized: object = tx1.sanitizeObject(tx1obj)
      expect(tx1obj).toStrictEqual(sanitized)
    })

    test("xssPreventionHTML", async (): Promise<void> => {
      const dirtyDom: string = "<img src='https://x' onerror=alert(1)//>"
      const sanitizedString: string = `<img src="https://x" />`

      const txu1: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )

      const tx1: Tx = avm.signTx(txu1)
      const tx1obj: object = tx1.serialize("hex")
      const dirtyObj: object = {
        ...tx1obj,
        dirtyDom: dirtyDom
      }
      const sanitizedObj: any = tx1.sanitizeObject(dirtyObj)
      expect(sanitizedObj.dirtyDom).toBe(sanitizedString)
    })

    test("buildBaseTx2", async (): Promise<void> => {
      const txu1: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt).sub(new BN(100)),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs2,
        new UTF8Payload("hello world")
      )
      const txu2: UnsignedTx = set.buildBaseTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        new BN(amnt).sub(new BN(100)),
        assetID,
        addrs3.map((a): Buffer => avm.parseAddress(a)),
        addrs1.map((a): Buffer => avm.parseAddress(a)),
        addrs2.map((a): Buffer => avm.parseAddress(a)),
        avm.getTxFee(),
        assetID,
        new UTF8Payload("hello world").getPayload(),
        UnixNow(),
        new BN(0),
        1
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const outies = txu1
        .getTransaction()
        .getOuts()
        .sort(TransferableOutput.comparator()) as TransferableOutput[]

      expect(outies.length).toBe(2)
      const outaddr0 = outies[0]
        .getOutput()
        .getAddresses()
        .map((a) => avm.addressFromBuffer(a))
      const outaddr1 = outies[1]
        .getOutput()
        .getAddresses()
        .map((a) => avm.addressFromBuffer(a))

      const testaddr2 = JSON.stringify(addrs2.sort())
      const testaddr3 = JSON.stringify(addrs3.sort())

      const testout0 = JSON.stringify(outaddr0.sort())
      const testout1 = JSON.stringify(outaddr1.sort())
      expect(
        (testaddr2 == testout0 && testaddr3 == testout1) ||
          (testaddr3 == testout0 && testaddr2 == testout1)
      ).toBe(true)

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)

      serialzeit(tx1, "BaseTx")
    })

    test("issueTx Serialized", async (): Promise<void> => {
      const txu: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )
      const tx = avm.signTx(txu)
      const txid: string =
        "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"

      const result: Promise<string> = avm.issueTx(tx.toString())
      const payload: object = {
        result: {
          txID: txid
        }
      }
      const responseObj: HttpResponse = {
        data: payload
      }
      mockAxios.mockResponse(responseObj)
      const response: string = await result

      expect(response).toBe(txid)
    })

    test("issueTx Buffer", async (): Promise<void> => {
      const txu: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )
      const tx = avm.signTx(txu)

      const txid: string =
        "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"
      const result: Promise<string> = avm.issueTx(tx.toBuffer())
      const payload: object = {
        result: {
          txID: txid
        }
      }
      const responseObj: HttpResponse = {
        data: payload
      }

      mockAxios.mockResponse(responseObj)
      const response: string = await result

      expect(response).toBe(txid)
    })
    test("issueTx Class Tx", async (): Promise<void> => {
      const txu: UnsignedTx = await avm.buildBaseTx(
        set,
        new BN(amnt),
        bintools.cb58Encode(assetID),
        addrs3,
        addrs1,
        addrs1
      )
      const tx = avm.signTx(txu)

      const txid: string =
        "f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7"

      const result: Promise<string> = avm.issueTx(tx)
      const payload: object = {
        result: {
          txID: txid
        }
      }
      const responseObj: HttpResponse = {
        data: payload
      }

      mockAxios.mockResponse(responseObj)
      const response: string = await result
      expect(response).toBe(txid)
    })

    test("buildCreateAssetTx - Fixed Cap", async (): Promise<void> => {
      avm.setCreationTxFee(new BN(fee))
      const txu1: UnsignedTx = await avm.buildCreateAssetTx(
        set,
        addrs1,
        addrs2,
        initialState,
        name,
        symbol,
        denomination
      )

      const txu2: UnsignedTx = set.buildCreateAssetTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs2.map((a) => avm.parseAddress(a)),
        initialState,
        name,
        symbol,
        denomination,
        undefined,
        CENTIAVAX,
        assetID
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "CreateAssetTx")
    })

    test("buildCreateAssetTx - Variable Cap", async (): Promise<void> => {
      avm.setCreationTxFee(new BN(Defaults.network[12345].P["creationTxFee"]))
      const mintOutputs: SECPMintOutput[] = [secpMintOut1, secpMintOut2]
      const txu1: UnsignedTx = await avm.buildCreateAssetTx(
        set,
        addrs1,
        addrs2,
        initialState,
        name,
        symbol,
        denomination,
        mintOutputs
      )

      const txu2: UnsignedTx = set.buildCreateAssetTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        addrs1.map((a) => avm.parseAddress(a)),
        addrs2.map((a) => avm.parseAddress(a)),
        initialState,
        name,
        symbol,
        denomination,
        mintOutputs,
        avm.getCreationTxFee(),
        assetID
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
    })

    test("buildSECPMintTx", async (): Promise<void> => {
      avm.setTxFee(new BN(fee))
      const newMinter: SECPMintOutput = new SECPMintOutput(
        addrs3.map((a) => avm.parseAddress(a)),
        new BN(0),
        1
      )
      const txu1: UnsignedTx = await avm.buildSECPMintTx(
        set,
        newMinter,
        secpMintXferOut1,
        addrs1,
        addrs2,
        secpMintUTXO.getUTXOID()
      )

      const txu2: UnsignedTx = set.buildSECPMintTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        newMinter,
        secpMintXferOut1,
        addrs1.map((a) => avm.parseAddress(a)),
        addrs2.map((a) => avm.parseAddress(a)),
        secpMintUTXO.getUTXOID(),
        MILLIAVAX,
        assetID
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "SECPMintTx")
    })

    test("buildCreateNFTAssetTx", async (): Promise<void> => {
      avm.setCreationTxFee(new BN(Defaults.network[12345].P["creationTxFee"]))
      const minterSets: MinterSet[] = [new MinterSet(1, addrs1)]
      const locktime: BN = new BN(0)

      const txu1: UnsignedTx = await avm.buildCreateNFTAssetTx(
        set,
        addrs1,
        addrs2,
        minterSets,
        name,
        symbol,
        new UTF8Payload("hello world"),
        UnixNow(),
        locktime
      )

      const txu2: UnsignedTx = set.buildCreateNFTAssetTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        addrs1.map((a: string): Buffer => avm.parseAddress(a)),
        addrs2.map((a: string): Buffer => avm.parseAddress(a)),
        minterSets,
        name,
        symbol,
        avm.getCreationTxFee(),
        assetID,
        new UTF8Payload("hello world").getPayload(),
        UnixNow(),
        locktime
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "CreateNFTAssetTx")
    })

    test("buildCreateNFTMintTx", async (): Promise<void> => {
      avm.setTxFee(new BN(fee))
      const groupID: number = 0
      const locktime: BN = new BN(0)
      const threshold: number = 1
      const payload: Buffer = Buffer.from("Avalanche")
      const addrbuff1: Buffer[] = addrs1.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const addrbuff2: Buffer[] = addrs2.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const addrbuff3: Buffer[] = addrs3.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const outputOwners: OutputOwners[] = []
      const oo: OutputOwners = new OutputOwners(addrbuff3, locktime, threshold)
      outputOwners.push()

      const txu1: UnsignedTx = await avm.buildCreateNFTMintTx(
        set,
        oo,
        addrs1,
        addrs2,
        nftutxoids,
        groupID,
        payload,
        undefined,
        UnixNow()
      )

      const txu2: UnsignedTx = set.buildCreateNFTMintTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        [oo],
        addrbuff1,
        addrbuff2,
        nftutxoids,
        groupID,
        payload,
        avm.getTxFee(),
        assetID,
        undefined,
        UnixNow()
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      outputOwners.push(oo)
      outputOwners.push(new OutputOwners(addrbuff3, locktime, threshold + 1))

      const txu3: UnsignedTx = await avm.buildCreateNFTMintTx(
        set,
        outputOwners,
        addrs1,
        addrs2,
        nftutxoids,
        groupID,
        payload,
        undefined,
        UnixNow()
      )

      const txu4: UnsignedTx = set.buildCreateNFTMintTx(
        avalanche.getNetworkID(),
        bintools.cb58Decode(avm.getBlockchainID()),
        outputOwners,
        addrbuff1,
        addrbuff2,
        nftutxoids,
        groupID,
        payload,
        avm.getTxFee(),
        assetID,
        undefined,
        UnixNow()
      )

      expect(txu4.toBuffer().toString("hex")).toBe(
        txu3.toBuffer().toString("hex")
      )
      expect(txu4.toString()).toBe(txu3.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "CreateNFTMintTx")
    })

    test("buildNFTTransferTx", async (): Promise<void> => {
      avm.setTxFee(new BN(fee))
      const pload: Buffer = Buffer.alloc(1024)
      pload.write(
        "All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.",
        0,
        1024,
        "utf8"
      )
      const addrbuff1 = addrs1.map((a: string): Buffer => avm.parseAddress(a))
      const addrbuff2 = addrs2.map((a: string): Buffer => avm.parseAddress(a))
      const addrbuff3 = addrs3.map((a: string): Buffer => avm.parseAddress(a))
      const txu1: UnsignedTx = await avm.buildNFTTransferTx(
        set,
        addrs3,
        addrs1,
        addrs2,
        nftutxoids[1],
        new UTF8Payload("hello world"),
        UnixNow(),
        new BN(0),
        1
      )

      const txu2: UnsignedTx = set.buildNFTTransferTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        addrbuff3,
        addrbuff1,
        addrbuff2,
        [nftutxoids[1]],
        avm.getTxFee(),
        assetID,
        new UTF8Payload("hello world").getPayload(),
        UnixNow(),
        new BN(0),
        1
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "NFTTransferTx")
    })

    test("buildImportTx", async (): Promise<void> => {
      const locktime: BN = new BN(0)
      const threshold: number = 1
      avm.setTxFee(new BN(fee))
      const addrbuff1 = addrs1.map((a) => avm.parseAddress(a))
      const addrbuff2 = addrs2.map((a) => avm.parseAddress(a))
      const addrbuff3 = addrs3.map((a) => avm.parseAddress(a))
      const fungutxo: UTXO = set.getUTXO(fungutxoids[1])
      const fungutxostr: string = fungutxo.toString()

      const result: Promise<UnsignedTx> = avm.buildImportTx(
        set,
        addrs1,
        PlatformChainID,
        addrs3,
        addrs1,
        addrs2,
        new UTF8Payload("hello world"),
        UnixNow(),
        locktime,
        threshold
      )
      const payload: object = {
        result: {
          utxos: [fungutxostr]
        }
      }
      const responseObj: HttpResponse = {
        data: payload
      }

      mockAxios.mockResponse(responseObj)
      const txu1: UnsignedTx = await result

      const txu2: UnsignedTx = set.buildImportTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        addrbuff3,
        addrbuff1,
        addrbuff2,
        [fungutxo],
        bintools.cb58Decode(PlatformChainID),
        avm.getTxFee(),
        await avm.getAVAXAssetID(),
        new UTF8Payload("hello world").getPayload(),
        UnixNow(),
        locktime,
        threshold
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "ImportTx")
    })

    test("buildExportTx", async (): Promise<void> => {
      avm.setTxFee(new BN(fee))
      const addrbuff1: Buffer[] = addrs1.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const addrbuff2: Buffer[] = addrs2.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const addrbuff3: Buffer[] = addrs3.map(
        (a: string): Buffer => avm.parseAddress(a)
      )
      const amount: BN = new BN(90)
      const type: SerializedType = "bech32"
      const txu1: UnsignedTx = await avm.buildExportTx(
        set,
        amount,
        bintools.cb58Decode(PlatformChainID),
        addrbuff3.map((a: Buffer): any =>
          serialization.bufferToType(a, type, avalanche.getHRP(), "P")
        ),
        addrs1,
        addrs2,
        new UTF8Payload("hello world"),
        UnixNow()
      )

      const txu2: UnsignedTx = set.buildExportTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        amount,
        assetID,
        addrbuff3,
        addrbuff1,
        addrbuff2,
        bintools.cb58Decode(PlatformChainID),
        avm.getTxFee(),
        assetID,
        new UTF8Payload("hello world").getPayload(),
        UnixNow()
      )

      expect(txu2.toBuffer().toString("hex")).toBe(
        txu1.toBuffer().toString("hex")
      )
      expect(txu2.toString()).toBe(txu1.toString())

      const txu3: UnsignedTx = await avm.buildExportTx(
        set,
        amount,
        PlatformChainID,
        addrs3,
        addrs1,
        addrs2,
        new UTF8Payload("hello world"),
        UnixNow()
      )

      const txu4: UnsignedTx = set.buildExportTx(
        networkID,
        bintools.cb58Decode(blockchainID),
        amount,
        assetID,
        addrbuff3,
        addrbuff1,
        addrbuff2,
        undefined,
        avm.getTxFee(),
        assetID,
        new UTF8Payload("hello world").getPayload(),
        UnixNow()
      )

      expect(txu4.toBuffer().toString("hex")).toBe(
        txu3.toBuffer().toString("hex")
      )
      expect(txu4.toString()).toBe(txu3.toString())

      const tx1: Tx = txu1.sign(avm.keyChain())
      const checkTx: string = tx1.toBuffer().toString("hex")
      const tx1obj: object = tx1.serialize("hex")
      const tx1str: string = JSON.stringify(tx1obj)
      const tx2newobj: object = JSON.parse(tx1str)
      const tx2: Tx = new Tx()
      tx2.deserialize(tx2newobj, "hex")

      const tx2obj: object = tx2.serialize("hex")
      const tx2str: string = JSON.stringify(tx2obj)
      expect(tx1obj).toStrictEqual(tx2obj)
      expect(tx1str).toStrictEqual(tx2str)
      expect(tx2.toBuffer().toString("hex")).toBe(checkTx)

      const tx3: Tx = txu1.sign(avm.keyChain())
      const tx3obj: object = tx3.serialize(display)
      const tx3str: string = JSON.stringify(tx3obj)
      const tx4newobj: object = JSON.parse(tx3str)
      const tx4: Tx = new Tx()
      tx4.deserialize(tx4newobj, display)

      const tx4obj: object = tx4.serialize(display)
      const tx4str: string = JSON.stringify(tx4obj)
      expect(tx3obj).toStrictEqual(tx4obj)
      expect(tx3str).toStrictEqual(tx4str)
      expect(tx4.toBuffer().toString("hex")).toBe(checkTx)
      serialzeit(tx1, "ExportTx")
    })

    test("buildGenesis", async (): Promise<void> => {
      const genesisData: object = {
        genesisData: {
          assetAlias1: {
            name: "human readable name",
            symbol: "AVAL",
            initialState: {
              fixedCap: [
                {
                  amount: 1000,
                  address: "A"
                },
                {
                  amount: 5000,
                  address: "B"
                }
              ]
            }
          },
          assetAliasCanBeAnythingUnique: {
            name: "human readable name",
            symbol: "AVAL",
            initialState: {
              variableCap: [
                {
                  minters: ["A", "B"],
                  threshold: 1
                },
                {
                  minters: ["A", "B", "C"],
                  threshold: 2
                }
              ]
            }
          }
        }
      }
      const bytes: string =
        "111TNWzUtHKoSvxohjyfEwE2X228ZDGBngZ4mdMUVMnVnjtnawW1b1zbAhzyAM1v6d7ECNj6DXsT7qDmhSEf3DWgXRj7ECwBX36ZXFc9tWVB2qHURoUfdDvFsBeSRqatCmj76eZQMGZDgBFRNijRhPNKUap7bCeKpHDtuCZc4YpPkd4mR84dLL2AL1b4K46eirWKMaFVjA5btYS4DnyUx5cLpAq3d35kEdNdU5zH3rTU18S4TxYV8voMPcLCTZ3h4zRsM5jW1cUzjWVvKg7uYS2oR9qXRFcgy1gwNTFZGstySuvSF7MZeZF4zSdNgC4rbY9H94RVhqe8rW7MXqMSZB6vBTB2BpgF6tNFehmYxEXwjaKRrimX91utvZe9YjgGbDr8XHsXCnXXg4ZDCjapCy4HmmRUtUoAduGNBdGVMiwE9WvVbpMFFcNfgDXGz9NiatgSnkxQALTHvGXXm8bn4CoLFzKnAtq3KwiWqHmV3GjFYeUm3m8Zee9VDfZAvDsha51acxfto1htstxYu66DWpT36YT18WSbxibZcKXa7gZrrsCwyzid8CCWw79DbaLCUiq9u47VqofG1kgxwuuyHb8NVnTgRTkQASSbj232fyG7YeX4mAvZY7a7K7yfSyzJaXdUdR7aLeCdLP6mbFDqUMrN6YEkU2X8d4Ck3T"
      const result: Promise<string> = api.buildGenesis(genesisData)
      const payload: object = {
        result: {
          bytes: bytes
        }
      }
      const responseObj: {
        data: object
      } = {
        data: payload
      }

      mockAxios.mockResponse(responseObj)
      const response: string = await result
      expect(response).toBe(bytes)
    })
  })
})
