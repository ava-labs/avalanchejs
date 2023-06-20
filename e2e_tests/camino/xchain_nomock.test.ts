import { getAvalanche, createTests, Matcher } from "../e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"

const avalanche = getAvalanche()
let keystore: KeystoreAPI
let tx = { value: "" }
let xChain: any
let pChain: any

beforeAll(async () => {
  await avalanche.fetchNetworkSettings()
  keystore = new KeystoreAPI(avalanche)
  xChain = avalanche.XChain()
  pChain = avalanche.PChain()
})
describe("Camino-XChain", (): void => {
  let asset = { value: "" }
  let addrB = { value: "" }
  let addrC = { value: "" }

  const user: string = "avalancheJsXChainUser"
  const passwd: string = "avalancheJsP1ssw4rd"
  const badUser: string = "asdfasdfsa"
  const badPass: string = "pass"
  const memo: string = "hello world"
  const adminAddress: string =
    "X-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
  const key: string =
    "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"

  const tests_spec: any = [
    [
      "createUser",
      () => keystore.createUser(user, passwd),
      (x) => x,
      Matcher.toEqual,
      () => {
        return {}
      }
    ],
    [
      "createaddrB",
      () => xChain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrB
    ],
    [
      "createaddrC",
      () => xChain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrC
    ],
    [
      "incorrectUser",
      () =>
        xChain.send(
          badUser,
          passwd,
          "CAM",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () =>
        `problem retrieving user "${badUser}": incorrect password for user "${badUser}"`
    ],
    [
      "incorrectPass",
      () =>
        xChain.send(
          user,
          badPass,
          "CAM",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () =>
        `problem retrieving user "${user}": incorrect password for user "${user}"`
    ],
    [
      "importKey",
      () => xChain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => adminAddress
    ],
    [
      "send",
      () =>
        xChain.send(
          user,
          passwd,
          "CAM",
          10,
          addrB.value,
          [adminAddress],
          adminAddress,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "sendMultiple",
      () =>
        xChain.sendMultiple(
          user,
          passwd,
          [
            { assetID: "CAM", amount: 10, to: addrB.value },
            { assetID: "CAM", amount: 20, to: addrC.value }
          ],
          [adminAddress],
          adminAddress,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "listAddrs",
      () => xChain.listAddresses(user, passwd),
      (x) => x.sort(),
      Matcher.toEqual,
      () => [adminAddress, addrB.value, addrC.value].sort()
    ],
    [
      "exportKey",
      () => xChain.exportKey(user, passwd, addrB.value),
      (x) => x,
      Matcher.toMatch,
      () => /PrivateKey-\w*/
    ],
    [
      "export",
      () =>
        xChain.export(
          user,
          passwd,
          "C" + addrB.value.substring(1),
          new BN(10),
          "CAM"
        ),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "import",
      () => xChain.import(user, passwd, addrB.value, "P"),
      (x) => x,
      Matcher.toThrow,
      () => "problem issuing transaction: no import inputs"
    ],
    [
      "createFixed",
      () =>
        xChain.createFixedCapAsset(user, passwd, "Camino", "CAM", 0, [
          { address: adminAddress, amount: "10000" }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "createVar",
      () =>
        xChain.createVariableCapAsset(user, passwd, "Camino", "CAM", 0, [
          { minters: [adminAddress], threshold: 1 }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "mint",
      () =>
        xChain.mint(user, passwd, 1500, asset.value, addrB.value, [
          adminAddress
        ]),
      (x) => x,
      Matcher.toThrow,
      () =>
        "provided addresses don't have the authority to mint the provided asset"
    ],
    [
      "getTx",
      () => xChain.getTx(tx.value), // retrieving tx via getTx is no longer possible until it's accepted
      (x) => x,
      Matcher.toThrow,
      () => "not found"
    ]
  ]

  createTests(tests_spec)
})
