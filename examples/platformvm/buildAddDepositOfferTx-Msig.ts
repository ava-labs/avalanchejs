import { Avalanche, BinTools, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UnsignedTx,
  Tx,
  DepositOffer,
  OfferFlag,
  PlatformVMConstants
} from "caminojs/apis/platformvm"
import { UnixNow, PChainAlias } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import BN from "bn.js"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners
} from "caminojs/common"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools = BinTools.getInstance()
const multiSigAliasMember1PrivateKey =
  "PrivateKey-2Vtf2ZhTRz6WcVcSH7cS7ghKneZxZ2L5W8assdCcaNDVdpoYfY" // P-kopernikus1jla8ty5c9ud6lsj8s4re2dvzvfxpzrxdcrd8q7
const msigAlias = "P-kopernikus1fwrv3kj5jqntuucw67lzgu9a9tkqyczxgcvpst"
const depositOwner = "P-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"

const depositOwnerPrivateKey =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"
let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(multiSigAliasMember1PrivateKey)
  pKeychain.importKey(depositOwnerPrivateKey)

  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const msigAliasBuffer = pchain.parseAddress(msigAlias)
  const owner = await pchain.getMultisigAlias(msigAlias)
  const startTime = UnixNow().add(new BN(600 * 1))
  const endTime: BN = startTime.add(new BN(26300000))

  const depositOfferMsigCreator = msigAlias // Warning: this address must have the role OFFERS_CREATOR
  const depositOfferMsigCreatorAuth: [number, string | Buffer][] = [
    [0, depositOfferMsigCreator]
  ]
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
    [[depositOfferMsigCreator], pAddressStrings],
    [depositOfferMsigCreator],
    offer,
    depositOfferMsigCreator,
    depositOfferMsigCreatorAuth,
    Buffer.from("new-deposit-offer")
  )

  // Create the hash from the tx
  const txbuff = unsignedTx.toBuffer()
  const msg: Buffer = Buffer.from(createHash("sha256").update(txbuff).digest())

  // create MSKeychain to create proper sigindx
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
  const tx: Tx = unsignedTx.sign(msKeyChain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
