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
const ownerPrivKey: string =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"

const bintools: BinTools = BinTools.getInstance()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey) // P-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const depositOwner = "P-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"
  const amountToLock = new BN(1000000)
  const depositOfferID = "2kRcnwGMJGZPQGKtq2ayBTsxjUaGdDSRphVfHV9KLHvuWhykgR"
  const depositDuration = 110
  const memo: Buffer = Buffer.from(
    "DepositTx v1 with singlesig deposit offer owner"
  )

  const depositCreator = pAddresses[0]
  const rewardsOwner = new OutputOwners([depositCreator], undefined, 1)
  const depositCreatorAuth: [number, string | Buffer][] = [[0, depositCreator]]

  const depositOfferOwnerAuth: [number, string | Buffer][] = [[0, depositOwner]]

  // hash concatenated bytes of offer id and deposit owner address
  const msgHashed: Buffer = Buffer.from(
    createHash("sha256")
      .update(
        Buffer.concat([bintools.cb58Decode(depositOfferID), depositCreator])
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

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
