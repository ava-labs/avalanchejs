import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  PlatformVMConstants
} from "caminojs/apis/platformvm"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners
} from "caminojs/common"

import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  DefaultLocalGenesisPrivateKey2,
  PChainAlias
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const bintools = BinTools.getInstance()
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey1: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const privKey2: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey2}`
const nodePrivKey: string =
  "PrivateKey-WwAkZg5m1rfHu5BzgqWdT3DyQEGNMH79TRYz1yrngKHKLUHnX"
const nodeID: string = "NodeID-LzCnkcHrmsynn3MDriRPocoid1oQnnkMF"
const asOf: BN = new BN(0)
const threshold: number = 1
const msigAliasArray = [
  "P-kopernikus1fq0jc8svlyazhygkj0s36qnl6s0km0h3uuc99w",
  "P-kopernikus1k4przmfu79ypp4u7y98glmdpzwk0u3sc7saazy"
]

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey1)
  pKeychain.importKey(privKey2)
  pKeychain.importKey(nodePrivKey)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const msigAlias = msigAliasArray[0] // use msig alias with multiple addresses

const sendRegisterNodeTx = async (): Promise<any> => {
  // Those are not serialized back and forth because
  // its so simple and has no methods
  let signatures: [string, string][] = []

  // these are serialized to test if their methods are
  // working properly
  let unsignedTxHex: string = ""
  let outputOwnersHex: string = ""

  // simulate tx creation
  {
    const owner = await pchain.getMultisigAlias(msigAlias)

    const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
    const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

    const unsignedTx: UnsignedTx = await pchain.buildRegisterNodeTx(
      utxoSet,
      [[msigAlias], pAddressStrings],
      [msigAlias],
      undefined,
      nodeID,
      msigAlias,
      [[0, msigAlias]],
      undefined,
      asOf,
      owner.threshold
    )

    // turn it into a hex blob
    unsignedTxHex = unsignedTx.toBuffer().toString("hex")
    outputOwnersHex = OutputOwners.toArray(
      unsignedTx.getTransaction().getOutputOwners()
    ).toString("hex")

    // simulate signing
    {
      // deserialize
      let unsignedTx = new UnsignedTx()
      unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

      // Create the hash from the tx
      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      for (let address of pAddresses) {
        // We need the keychain for signing
        const keyPair = pKeychain.getKey(address)
        // The signature
        const signature = keyPair.sign(msg)
        // save the signature
        signatures.push([keyPair.getAddressString(), signature.toString("hex")])
      }
    }

    // simulate reconstruciton
    {
      // load msig configuration from node
      const msigAliasBuffer = pchain.parseAddress(msigAlias)
      const owner = await pchain.getMultisigAlias(msigAlias)

      // deserialize
      let unsignedTx = new UnsignedTx()
      unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

      // parse and set output owners - are requried for msig resolving
      let parsedOwners: OutputOwners[] = OutputOwners.fromArray(
        Buffer.from(outputOwnersHex, "hex")
      )
      unsignedTx.getTransaction().setOutputOwners(parsedOwners)

      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      // create MSKeychein to create proper signidx
      const msKeyChain = new MultisigKeyChain(
        avalanche.getHRP(),
        PChainAlias,
        msg,
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        unsignedTx.getTransaction().getOutputOwners(),
        new Map([
          [
            msigAliasBuffer.toString("hex"),
            new OutputOwners(
              owner.addresses.map((a) => bintools.parseAddress(a, "P")),
              new BN(owner.locktime),
              owner.threshold
            )
          ]
        ])
      )

      // load the signatures from the store/map/signavault
      for (let [addressString, hexSignature] of signatures) {
        let address = pchain.parseAddress(addressString)
        let signature = Buffer.from(hexSignature, "hex")
        msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
      }

      msKeyChain.buildSignatureIndices()

      // Apply the signatures and send the tx
      const tx: Tx = unsignedTx.sign(msKeyChain)
      const txid: string = await pchain.issueTx(tx)
      console.log(`Success! TXID: ${txid}`)
    }
  }
}

const sendAddValidatorTx = async (): Promise<any> => {
  // Those are not serialized back and forth because
  // its so simple and has no methods
  let signatures: [string, string][] = []

  // these are serialized to test if their methods are
  // working properly
  let unsignedTxHex: string = ""
  let outputOwnersHex: string = ""

  // simulate tx creation
  {
    const owner = await pchain.getMultisigAlias(msigAlias)

    const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
    const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

    let startDate = new Date(Date.now() + 0.5 * 60 * 1000).getTime() / 1000
    let endDate = startDate + 60 * 60 * 24 * 10

    const unsignedTx: UnsignedTx = await pchain.buildAddValidatorTx(
      utxoSet,
      [msigAlias],
      [[msigAlias], pAddressStrings],
      [msigAlias],
      nodeID,
      new BN(startDate),
      new BN(endDate),
      new BN(2000000000000),
      [msigAlias],
      0, // delegation fee
      undefined,
      threshold,
      undefined,
      asOf,
      owner.threshold,
      owner.threshold
    )

    // turn it into a hex blob
    unsignedTxHex = unsignedTx.toBuffer().toString("hex")
    outputOwnersHex = OutputOwners.toArray(
      unsignedTx.getTransaction().getOutputOwners()
    ).toString("hex")
  }

  // simulate signing
  {
    // deserialize
    let unsignedTx = new UnsignedTx()
    unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

    // Create the hash from the tx
    const txbuff = unsignedTx.toBuffer()
    const msg: Buffer = Buffer.from(
      createHash("sha256").update(txbuff).digest()
    )

    for (let address of pAddresses) {
      // We need the keychain for signing
      const keyPair = pKeychain.getKey(address)
      // The signature
      const signature = keyPair.sign(msg)
      // save the signature
      signatures.push([keyPair.getAddressString(), signature.toString("hex")])
    }
  }

  // simulate reconstruciton
  {
    // load msig configuration from node
    const msigAliasBuffer = pchain.parseAddress(msigAlias)
    const owner = await pchain.getMultisigAlias(msigAlias)

    // deserialize
    let unsignedTx = new UnsignedTx()
    unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

    // parse and set output owners - are requried for msig resolving
    let parsedOwners: OutputOwners[] = OutputOwners.fromArray(
      Buffer.from(outputOwnersHex, "hex")
    )
    unsignedTx.getTransaction().setOutputOwners(parsedOwners)

    const txbuff = unsignedTx.toBuffer()
    const msg: Buffer = Buffer.from(
      createHash("sha256").update(txbuff).digest()
    )

    // create MSKeychein to create proper signidx
    const msKeyChain = new MultisigKeyChain(
      avalanche.getHRP(),
      PChainAlias,
      msg,
      PlatformVMConstants.SECPMULTISIGCREDENTIAL,
      unsignedTx.getTransaction().getOutputOwners(),
      new Map([
        [
          msigAliasBuffer.toString("hex"),
          new OutputOwners(
            owner.addresses.map((a) => bintools.parseAddress(a, "P")),
            new BN(owner.locktime),
            owner.threshold
          )
        ]
      ])
    )

    // load the signatures from the store/map/signavault
    for (let [addressString, hexSignature] of signatures) {
      let address = pchain.parseAddress(addressString)
      let signature = Buffer.from(hexSignature, "hex")
      msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
    }

    msKeyChain.buildSignatureIndices()

    // Apply the signatures and send the tx
    const tx: Tx = unsignedTx.sign(msKeyChain)
    const txid: string = await pchain.issueTx(tx)
    console.log(`Success! TXID: ${txid}`)
  }
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  try {
    await sendRegisterNodeTx()
    await sendAddValidatorTx()
  } catch (e) {
    console.log(e)
  }
}

main()
