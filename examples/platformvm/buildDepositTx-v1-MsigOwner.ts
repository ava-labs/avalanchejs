import { Avalanche, BinTools, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx
} from "caminojs/apis/platformvm"
import { OutputOwners } from "caminojs/common/output"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import BN from "bn.js"
import createHash from "create-hash"
import { SignerKeyPair } from "caminojs/common"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const msigAlias = "P-kopernikus1fwrv3kj5jqntuucw67lzgu9a9tkqyczxgcvpst"
const multiSigAliasMember1PrivateKey =
  "PrivateKey-2Vtf2ZhTRz6WcVcSH7cS7ghKneZxZ2L5W8assdCcaNDVdpoYfY" // P-kopernikus1jla8ty5c9ud6lsj8s4re2dvzvfxpzrxdcrd8q7

const bintools: BinTools = BinTools.getInstance()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)
  pKeychain.importKey(multiSigAliasMember1PrivateKey)
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const depositOwner = msigAlias
  const msigAliasBuffer = pchain.parseAddress(msigAlias)
  const amountToLock = new BN(10000000)
  const depositOfferID = "27pLgKVoXqtSWqGtBTtGkVKmZUM3MYTsjDjNzuLEr9gWiVGXy3"
  const depositDuration = 110
  const memo: Buffer = Buffer.from("DepositTx v1 with msig deposit offer owner")
  const owners = new OutputOwners(
    pchain.keyChain().getAddresses(),
    undefined,
    1
  )

  const depositOfferCreator = pAddressStrings[0] // Warning: this address must have the role OFFERS_CREATOR
  const depositOfferCreatorAuth: [number, string | Buffer][] = [
    [0, depositOfferCreator]
  ]

  const depositOfferOwnerAuth: [number, string | Buffer][] = [[0, depositOwner]]

  // hash concatenated bytes of offer id and deposit owner address
  const msgHashed: Buffer = Buffer.from(
    createHash("sha256")
      .update(
        Buffer.concat([
          bintools.cb58Decode(depositOfferID),
          pchain.parseAddress(depositOfferCreator)
        ])
      )
      .digest()
  )
  const keypair: SignerKeyPair = pKeychain.getKey(
    pKeychain.getAddresses()[1] // msig member 1
  )
  // sign the hash
  const signatureBuffer: Buffer = keypair.sign(msgHashed)

  const unsignedTx: UnsignedTx = await pchain.buildDepositTx(
    1,
    undefined,
    pAddressStrings,
    pAddressStrings,
    depositOfferID,
    depositDuration,
    owners,
    depositOfferCreator,
    depositOfferCreatorAuth,
    [signatureBuffer],
    depositOfferOwnerAuth,
    memo,
    new BN(0),
    amountToLock
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
