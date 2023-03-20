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
  // load msig config
  const msigAliasBuffer = pchain.parseAddress(msigAlias)
  const owner = await pchain.getMultisigAlias(msigAlias)

  const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  // Create Tx for registering Node
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

  // Create the hash from the tx
  const txbuff = unsignedTx.toBuffer()
  const msg: Buffer = Buffer.from(createHash("sha256").update(txbuff).digest())

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

  for (let address of pAddresses) {
    // We need the keychain for signing
    const keyPair = pKeychain.getKey(address)
    // The signature
    const signature = keyPair.sign(msg)
    // add the signature
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
  }

  msKeyChain.buildSignatureIndices()

  // Send TX
  const tx: Tx = unsignedTx.sign(msKeyChain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

const sendAddValidatorTx = async (): Promise<any> => {
  // load msig config
  const msigAliasBuffer = pchain.parseAddress(msigAlias)
  const owner = await pchain.getMultisigAlias(msigAlias)

  const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  // Create Tx for adding a validator to the active set
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

  // Create the hash from the tx
  const txbuff = unsignedTx.toBuffer()
  const msg: Buffer = Buffer.from(createHash("sha256").update(txbuff).digest())

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

  for (let address of pAddresses) {
    // We need the keychain for signing
    const keyPair = pKeychain.getKey(address)
    // The signature
    const signature = keyPair.sign(msg)
    // add the signature
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
  }

  msKeyChain.buildSignatureIndices()

  // Send TX
  const tx: Tx = unsignedTx.sign(msKeyChain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
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
