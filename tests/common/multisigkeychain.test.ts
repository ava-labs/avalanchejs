import { Buffer } from "buffer/"
import { DefaultPlatformChainID, PChainAlias } from "../../src/utils"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners,
  SignatureError
} from "../../src/common"
import {
  KeyChain,
  PlatformVMAPI,
  PlatformVMConstants
} from "../../src/apis/platformvm"
import BN from "bn.js"
import BinTools from "../../src/utils/bintools"
import Avalanche from "../../src/index"

const bintools: BinTools = BinTools.getInstance()
const msigAlias = "P-kopernikus1t5qgr9hcmf2vxj7k0hz77kawf9yr389cxte5j0"
const msigAliasBuffer = bintools.parseAddress(
  msigAlias,
  DefaultPlatformChainID,
  PChainAlias,
  PlatformVMConstants.ADDRESSLENGTH
)

const avalanche: Avalanche = new Avalanche(
  "127.0.0.1",
  9650,
  "https",
  12345,
  undefined,
  undefined
)
const pkeys = [
  "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN",
  "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
]
const owner = {
  addresses: [
    "P-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68",
    "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
  ],
  threshold: 2
}
let platformVM: PlatformVMAPI
let keychain: KeyChain
beforeAll(async () => {
  platformVM = new PlatformVMAPI(avalanche, "/ext/bc/P")
  keychain = platformVM.keyChain()

  for (let i = 0; i < pkeys.length; i++) {
    keychain.importKey(pkeys[i])
  }
})
describe("BuildSignatureIndices", (): void => {
  test("Cyclic multisig alias", (): void => {
    const outputOwners = new OutputOwners(
      [msigAliasBuffer],
      new BN(0),
      owner.threshold
    )
    const msKeyChain = new MultisigKeyChain(
      "kopernikus",
      PChainAlias,
      Buffer.from(""), // empty buffer
      PlatformVMConstants.SECPMULTISIGCREDENTIAL,
      [outputOwners],
      new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
    )

    expect(() => msKeyChain.buildSignatureIndices()).toThrow(
      new Error("Cyclic multisig alias")
    )
  }),
    test("Not enough signatures 0/2", (): void => {
      const outputOwners = new OutputOwners(
        owner.addresses.map((a) => bintools.parseAddress(a, "P")),
        new BN(0),
        owner.threshold
      )
      const msKeyChain = new MultisigKeyChain(
        "kopernikus",
        PChainAlias,
        Buffer.from(""), // empty buffer
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        [outputOwners],
        new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
      )

      expect(() => msKeyChain.buildSignatureIndices()).toThrow(
        new SignatureError("Not enough signatures")
      )
    }),
    test("Not enough signatures 1/2", (): void => {
      const msg = Buffer.from("empty msg")
      const outputOwners = new OutputOwners(
        owner.addresses.map((a) => bintools.parseAddress(a, "P")),
        new BN(0),
        owner.threshold
      )
      const msKeyChain = new MultisigKeyChain(
        "kopernikus",
        PChainAlias,
        msg, // empty buffer
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        [outputOwners],
        new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
      )

      // add PK to keychain and KeyPair to msKeyChain
      const keyPair = keychain.getKey(keychain.getAddresses()[0])
      // The signature
      const signature = keyPair.sign(msg)
      msKeyChain.addKey(
        new MultisigKeyPair(msKeyChain, keychain.getAddresses()[0], signature)
      )

      expect(() => msKeyChain.buildSignatureIndices()).toThrow(
        new SignatureError("Not enough signatures")
      )
    }),
    test("Success - single txOwner", (): void => {
      const msg = Buffer.from("empty msg")
      const outputOwners = new OutputOwners(
        owner.addresses.map((a) => bintools.parseAddress(a, "P")),
        new BN(0),
        owner.threshold
      )
      const msKeyChain = new MultisigKeyChain(
        "kopernikus",
        PChainAlias,
        msg, // empty buffer
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        [outputOwners],
        new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
      )
      addSignatures(msg, msKeyChain)
      msKeyChain.buildSignatureIndices()

      expect(msKeyChain["sigIdxs"][0].length).toBe(2) // assert that there are 2 signatures for the first txOwner
    }),
    test("Success - multiple txOwners", (): void => {
      const msg = Buffer.from("empty msg")
      const outputOwners = new OutputOwners(
        owner.addresses.map((a) => bintools.parseAddress(a, "P")),
        new BN(0),
        owner.threshold
      )
      const outputOwners2 = new OutputOwners(
        [bintools.parseAddress(owner.addresses[1], "P")],
        new BN(0),
        1
      )
      const msKeyChain = new MultisigKeyChain(
        "kopernikus",
        PChainAlias,
        msg, // empty buffer
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        [outputOwners, outputOwners2],
        new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
      )
      addSignatures(msg, msKeyChain)
      msKeyChain.buildSignatureIndices()

      expect(msKeyChain["sigIdxs"][0].length).toBe(2) // assert that there are 2 signatures for the first txOwner
      expect(msKeyChain["sigIdxs"][1].length).toBe(1) // assert that there is 1 signature for the second txOwner
    })
})

function addSignatures(msg: Buffer, msKeyChain: MultisigKeyChain) {
  // add PKs to keychain and KeyPairs to msKeyChain
  for (let i = 0; i < pkeys.length; i++) {
    const keyPair = keychain.getKey(keychain.getAddresses()[i])
    // The signature
    const signature = keyPair.sign(msg)
    msKeyChain.addKey(
      new MultisigKeyPair(msKeyChain, keychain.getAddresses()[i], signature)
    )
  }
}
