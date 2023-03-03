import { Avalanche, BN, Buffer } from "caminojs/index"
import { AVMAPI, KeyChain, Tx, UnsignedTx, UTXOSet } from "caminojs/apis/avm"
import {
  GetBalanceResponse,
  GetUTXOsResponse
} from "caminojs/apis/avm/interfaces"
import {
  KeyChain as PlatformVMKeyChain,
  PlatformVMAPI
} from "caminojs/apis/platformvm"
import {
  DefaultLocalGenesisPrivateKey,
  PrivateKeyPrefix,
  UnixNow
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildExportTx to export AVAX to the P-Chain from the X-Chain"
)

let xchain: AVMAPI
let pchain: PlatformVMAPI
let xKeychain: KeyChain
let pKeychain: PlatformVMKeyChain
let xAddressStrings: string[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  pchain = avalanche.PChain()
  xKeychain = xchain.keyChain()
  pKeychain = pchain.keyChain()
  xKeychain.importKey(privKey)
  pKeychain.importKey(privKey)
  xAddressStrings = xchain.keyChain().getAddressStrings()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = xchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const getBalanceResponse: GetBalanceResponse = await xchain.getBalance(
    xAddressStrings[0],
    avaxAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await xchain.buildExportTx(
    utxoSet,
    amount,
    pChainBlockchainID,
    pAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
