import { Avalanche, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx,
  DepositOffer,
  OfferFlag
} from "caminojs/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import BN from "bn.js"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

/**
 * @ignore
 */
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const ownerPrivKey: string =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"
let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)
  // P-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq
  pKeychain.importKey(ownerPrivKey)

  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const startTime = UnixNow().add(new BN(600 * 1))
  const endTime: BN = startTime.add(new BN(26300000))

  const depositOfferCreator = pAddressStrings[0] // Warning: this address must have the role OFFERS_CREATOR
  const depositOfferCreatorAuth: [number, string | Buffer][] = [
    [0, depositOfferCreator]
  ]
  const depositOwner = pAddressStrings[1]
  const offer: DepositOffer = {
    upgradeVersion: 1,
    id: undefined,
    interestRateNominator: new BN(1000000000),
    start: startTime,
    end: endTime,
    minAmount: new BN(1000000), // min deposit amount = 1 milliAvax
    totalMaxAmount: undefined,
    depositedAmount: undefined,
    minDuration: 60,
    maxDuration: 360,
    unlockPeriodDuration: 20,
    noRewardsPeriodDuration: 10,
    memo: "post-genesis-deposit-offer",
    flags: new BN(OfferFlag.NONE),
    totalMaxRewardAmount: new BN(1000000),
    rewardedAmount: new BN(0),
    ownerAddress: depositOwner
  }
  const unsignedTx: UnsignedTx = await pchain.buildAddDepositOfferTx(
    undefined,
    [depositOfferCreator],
    [depositOfferCreator],
    offer,
    depositOfferCreator,
    depositOfferCreatorAuth,
    Buffer.from("new-deposit-offer")
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
