import { Avalanche, BinTools, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  PlatformVMConstants,
  DepositTx
} from "caminojs/apis/platformvm"
import { OutputOwners } from "caminojs/common/output"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey2,
  PChainAlias
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import BN from "bn.js"
import createHash from "create-hash"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  SignerKeyPair
} from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const ownerPrivKey: string =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"
const msigAlias = "P-kopernikus1t5qgr9hcmf2vxj7k0hz77kawf9yr389cxte5j0"
const pkeys = [
  "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN",
  "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
]
const owner = {
  addresses: [
    "P-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68",
    "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
  ],
  threshold: 2,
  locktime: 0
}

const bintools: BinTools = BinTools.getInstance()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey2}`
let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // pKeychain.importKey(privKey) // P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3
  pKeychain.importKey(pkeys[0]) // P-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68
  pKeychain.importKey(pkeys[1]) // P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const depositOwner = "P-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"
  const msigAliasBuffer = pchain.parseAddress(msigAlias)
  const amountToLock = new BN(1000000)
  const depositOfferID = "2kRcnwGMJGZPQGKtq2ayBTsxjUaGdDSRphVfHV9KLHvuWhykgR"
  const depositDuration = 110
  const memo: Buffer = Buffer.from("DepositTx v1 with msig deposit creator")
  const rewardsOwner = new OutputOwners([msigAliasBuffer], undefined, 1)

  const depositCreator = msigAlias // Warning: this address must have the role OFFERS_CREATOR
  const depositCreatorAuth: [number, string | Buffer][] = [[0, depositCreator]]

  const depositOfferOwnerAuth: [number, string | Buffer][] = [[1, depositOwner]]

  // hash concatenated bytes of offer id and deposit owner address
  const msgHashed: Buffer = Buffer.from(
    createHash("sha256")
      .update(
        Buffer.concat([bintools.cb58Decode(depositOfferID), msigAliasBuffer])
      )
      .digest()
  )

  const keypair: SignerKeyPair = pKeychain.importKey(ownerPrivKey)
  // sign the hash
  const signatureBuffer: Buffer = keypair.sign(msgHashed)

  const unsignedTx: UnsignedTx = await pchain.buildDepositTx(
    1,
    undefined,
    pAddressStrings,
    pAddressStrings,
    depositOfferID,
    depositDuration,
    rewardsOwner,
    depositCreator,
    depositCreatorAuth,
    [signatureBuffer],
    depositOfferOwnerAuth,
    memo,
    new BN(0),
    amountToLock
  )

  // Create the hash from the tx
  const txbuff = unsignedTx.toBuffer()
  const msg: Buffer = Buffer.from(createHash("sha256").update(txbuff).digest())

  // Create the Multisig keychain
  const addresses = owner.addresses.map((a) => bintools.parseAddress(a, "P"))
  const outputOwners = new OutputOwners(
    addresses,
    new BN(owner.locktime),
    owner.threshold
  )

  const numAddresses =
    depositOfferOwnerAuth.length > 0
      ? depositOfferOwnerAuth.at(depositOfferOwnerAuth.length - 1)[0]
      : 0

  const msKeyChain = new MultisigKeyChain(
    avalanche.getHRP(),
    PChainAlias,
    msg,
    PlatformVMConstants.SECPMULTISIGCREDENTIAL,
    unsignedTx.getTransaction().getOutputOwners(),
    new Map([[msigAliasBuffer.toString("hex"), outputOwners]])
  )

  for (const address of pAddresses) {
    // We need the keychain for signing
    const keyPair = pKeychain.getKey(address)
    // The signature
    const signature = keyPair.sign(msg)
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
  }

  // Add owner signatures to the multisig keychain
  const sigs = (unsignedTx.getTransaction() as DepositTx).getOwnerSignatures()
  sigs.forEach((v) => {
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, v[0], v[1]))
  })

  // Create signature indices (throws if not able to do so)
  msKeyChain.buildSignatureIndices()

  // Sign the transaction with msig keychain and issue
  const tx = unsignedTx.sign(msKeyChain)
  const txid = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
