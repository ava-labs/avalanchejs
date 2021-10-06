import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import { BlockParameter } from "src/apis/evm/interfaces"

describe("CChain", (): void => {
  const avalanche = getAvalanche()
  const cchain = avalanche.CChain()
  const keystore = new KeystoreAPI(avalanche)

  let exportTxHash = { value: "" }

  const user: string = "avalancheJsCChainUser"
  const passwd: string = "avalancheJsP@ssw4rd"
  const key: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
  const privateKeyHex: string =
    "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
  const to: string = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7"
  const tag: BlockParameter = "latest"
  const data: string = "0xc92aecc4"
  const hash: string =
    "0x14d9c2aeec20254d966a947e23eb3172ae5067e66fd4e69aecc3c9d6ff24443a"
  const rawTx: string =
    "0xf86f028534630b8a0082520894197e90f9fad81970ba7976f33cbd77088e5d7cf7880f43fc2c04ee000080830150f4a0b3b2c1d0348822a4bbfacba46d2525bd3949c8a89a2de015811d2a2a8f695003a07e9ee1c98bfe6e35cce932540c25f2552fb67f3a22c5fdd51b63d7e35363b9e2"
  const txHash: string =
    "0x58cbd8363e9bf3258779599f482f914e6646c8bee63b6f65c311d134f547f3f2"
  const whaleAddr: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
  const xChainAddr: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"

  // test_name        response_promise                            resp_fn          matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "createUser",
      () => keystore.createUser(user, passwd),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "importKey",
      () => cchain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => whaleAddr
    ],
    [
      "exportAVAX",
      () => cchain.exportAVAX(user, passwd, xChainAddr, new BN(10)),
      (x) => x,
      Matcher.Get,
      () => exportTxHash
    ],
    [
      "getBaseFee",
      () => cchain.getBaseFee(),
      (x) => x,
      Matcher.toBe,
      () => "0x34630b8a00"
    ],
    [
      "getBlockNumber",
      () => cchain.getBlockNumber(),
      (x) => x,
      Matcher.toBe,
      () => "0x0"
    ],
    [
      "getEthCall",
      () => cchain.getEthCall({ to, data }, tag),
      (x) => x,
      Matcher.toBe,
      () => "0x"
    ],
    [
      "getEthChainID",
      () => cchain.getEthChainID(),
      (x) => x,
      Matcher.toBe,
      () => "0xa868"
    ],
    [
      "getAvaxBalance",
      () => cchain.getAvaxBalance(to, tag),
      (x) => x,
      Matcher.toBe,
      () => "0x0"
    ],
    [
      "getTransactionCount",
      () => cchain.getTransactionCount(to, tag),
      (x) => x,
      Matcher.toBe,
      () => "0x0"
    ],
    [
      "getBlockByHash",
      () => cchain.getBlockByHash(hash, true),
      (x) => x,
      Matcher.toBe,
      () => null
    ],
    [
      "sendRawTransaction",
      () => cchain.sendRawTransaction(rawTx),
      (x) => x,
      Matcher.toBe,
      () => txHash
    ],
    [
      "web3Sha3",
      () => cchain.web3Sha3(data),
      (x) => x,
      Matcher.toBe,
      () => "0x33d900c038e159887701e03767765494e2095283ea534e93656732c6c8fc358d"
    ],
    [
      "web3ClientVersion",
      () => cchain.web3ClientVersion(),
      (x) => x,
      Matcher.toMatch,
      () => /v+/
    ],
    [
      "netVersion",
      () => cchain.netVersion(),
      (x) => x,
      Matcher.toBe,
      () => "1"
    ],
    [
      "getMaxPriorityFeePerGas",
      () => cchain.getMaxPriorityFeePerGas(),
      (x) => x,
      Matcher.toBe,
      () => "0x0"
    ],
    [
      "exportKey",
      () => cchain.exportKey(user, passwd, whaleAddr),
      (x) => x,
      Matcher.toEqual,
      () => ({
        privateKey: key,
        privateKeyHex: privateKeyHex
      })
    ]
  ]

  createTests(tests_spec)
})
