import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"

describe("XChain", (): void => {
  let tx = { value: "" }
  let asset = { value: "" }
  let addrB = { value: "" }
  let addrC = { value: "" }

  const avalanche = getAvalanche()
  const xchain = avalanche.XChain()
  const keystore = new KeystoreAPI(avalanche)

  const user: string = "avalancheJsXChainUser"
  const passwd: string = "avalancheJsP1ssw4rd"
  const badUser: string = "asdfasdfsa"
  const badPass: string = "pass"
  const memo: string = "hello world"
  const whaleAddr: string = "X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const key: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"

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
      "createaddrB",
      () => xchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrB
    ],
    [
      "createaddrB",
      () => xchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrC
    ],
    [
      "incorrectUser",
      () =>
        xchain.send(
          badUser,
          passwd,
          "AVAX",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () => `problem retrieving user "${badUser}": incorrect password for user "${badUser}"`
    ],
    [
      "incorrectPass",
      () =>
        xchain.send(
          user,
          badPass,
          "AVAX",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () => `problem retrieving user "${user}": incorrect password for user "${user}"`
    ],
    [
      "getBalance",
      () => xchain.getBalance(whaleAddr, "AVAX"),
      (x) => x.balance,
      Matcher.toBe,
      () => "300000000000000000"
    ],
    [
      "getBalance2",
      () => xchain.getBalance(whaleAddr, "AVAX"),
      (x) => x.utxoIDs[0].txID,
      Matcher.toBe,
      () => "BUuypiq2wyuLMvyhzFXcPyxPMCgSp7eeDohhQRqTChoBjKziC"
    ],
    [
      "importKey",
      () => xchain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => whaleAddr
    ],
    [
      "send",
      () =>
        xchain.send(
          user,
          passwd,
          "AVAX",
          10,
          addrB.value,
          [whaleAddr],
          whaleAddr,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "sendMultiple",
      () =>
        xchain.sendMultiple(
          user,
          passwd,
          [
            { assetID: "AVAX", amount: 10, to: addrB.value },
            { assetID: "AVAX", amount: 20, to: addrC.value }
          ],
          [whaleAddr],
          whaleAddr,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "listAddrs",
      () => xchain.listAddresses(user, passwd),
      (x) => x.sort(),
      Matcher.toEqual,
      () => [whaleAddr, addrB.value, addrC.value].sort()
    ],
    [
      "exportKey",
      () => xchain.exportKey(user, passwd, addrB.value),
      (x) => x,
      Matcher.toMatch,
      () => /PrivateKey-\w*/
    ],
    [
      "export",
      () =>
        xchain.export(
          user,
          passwd,
          "C" + addrB.value.substring(1),
          new BN(10),
          "AVAX"
        ),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't unmarshal an argument"
    ],
    [
      "import",
      () => xchain.import(user, passwd, addrB.value, "P"),
      (x) => x,
      Matcher.toThrow,
      () => "problem issuing transaction: no import inputs"
    ],
    [
      "createFixed",
      () =>
        xchain.createFixedCapAsset(user, passwd, "Some Coin", "SCC", 0, [
          { address: whaleAddr, amount: "10000" }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "createVar",
      () =>
        xchain.createVariableCapAsset(user, passwd, "Some Coin", "SCC", 0, [
          { minters: [whaleAddr], threshold: 1 }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "mint",
      () =>
        xchain.mint(user, passwd, 1500, asset.value, addrB.value, [whaleAddr]),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't unmarshal an argument"
    ],
    [
      "getTx",
      () => xchain.getTx(tx.value),
      (x) => x,
      Matcher.toMatch,
      () => /\w+/
    ],
    [
      "getTxStatus",
      () => xchain.getTxStatus(tx.value),
      (x) => x,
      Matcher.toBe,
      () => "Processing"
    ],
    [
      "getAssetDesc",
      () => xchain.getAssetDescription(asset.value),
      (x) => [x.name, x.symbol],
      Matcher.toEqual,
      () => ["Some Coin", "SCC"]
    ]
  ]

  createTests(tests_spec)
})