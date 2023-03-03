import { Avalanche, BN } from "caminojs/index"
import {
  KeyChain as PlatformKeyChain,
  PlatformVMAPI
} from "caminojs/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  Tx,
  UnsignedTx
} from "caminojs/apis/evm"
import { DefaultLocalGenesisPrivateKey, PrivateKeyPrefix } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const Web3 = require("web3")
const path: string = "/ext/bc/C/rpc"
const web3: any = new Web3(
  `${config.protocol}://${config.host}:${config.port}${path}`
)
const threshold: number = 1

let pchain: PlatformVMAPI
let cchain: EVMAPI
let pKeychain: PlatformKeyChain
let cKeychain: EVMKeyChain
let pAddressStrings: string[]
let cAddressStrings: string[]
let pChainBlockchainIdStr: string
let avaxAssetID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  cchain = avalanche.CChain()
  pKeychain = pchain.keyChain()
  cKeychain = cchain.keyChain()
  pKeychain.importKey(privKey)
  cKeychain.importKey(privKey)
  pAddressStrings = pchain.keyChain().getAddressStrings()
  cAddressStrings = cchain.keyChain().getAddressStrings()
  pChainBlockchainIdStr = avalanche.getNetwork().P.blockchainID
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16))
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)
  let avaxAmount: BN = new BN(1e7)
  let fee: BN = baseFee.div(new BN(1e9))
  fee = fee.add(new BN(1e6))

  let unsignedTx: UnsignedTx = await cchain.buildExportTx(
    avaxAmount,
    avaxAssetID,
    pChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    pAddressStrings,
    nonce,
    locktime,
    threshold,
    fee
  )

  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
