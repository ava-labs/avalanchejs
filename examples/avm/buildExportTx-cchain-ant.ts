import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  AVMAPI,
  KeyChain,
  Tx,
  UnsignedTx,
  UTXOSet
} from "@c4tplatform/caminojs/dist/apis/avm"
import { GetUTXOsResponse } from "@c4tplatform/caminojs/dist/apis/avm/interfaces"
import {
  EVMAPI,
  KeyChain as EVMKeyChain
} from "@c4tplatform/caminojs/dist/apis/evm"
import {
  DefaultLocalGenesisPrivateKey,
  PrivateKeyPrefix,
  UnixNow
} from "@c4tplatform/caminojs/dist/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const bintools: BinTools = BinTools.getInstance()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`

const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildExportTx to export ANT to the C-Chain from the X-Chain"
)

let xchain: AVMAPI
let cchain: EVMAPI
let xKeychain: KeyChain
let cKeychain: EVMKeyChain
let xAddresses: Buffer[]
let xAddressStrings: string[]
let cAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let xBlockchainID: string
let cChainBlockchainID: string
let avaxAssetIDBuf: Buffer

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
  cchain = avalanche.CChain()
  xKeychain = xchain.keyChain()
  cKeychain = cchain.keyChain()
  xKeychain.importKey(privKey)
  cKeychain.importKey(privKey)
  xAddresses = xchain.keyChain().getAddresses()
  xAddressStrings = xchain.keyChain().getAddressStrings()
  cAddressStrings = cchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = xchain.getDefaultTxFee()
  xBlockchainID = avalanche.getNetwork().X.blockchainID
  cChainBlockchainID = avalanche.getNetwork().C.blockchainID
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avmUTXOResponse: GetUTXOsResponse = await xchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const amount: BN = new BN(350)
  const toThreshold: number = 1
  const changeThreshold: number = 1
  const assetID: string = "Ycg5QzddNwe3ebfFXhoGUDnWgC6GE88QRakRnn9dp3nGwqCwD"

  const unsignedTx: UnsignedTx = await xchain.buildExportTx(
    utxoSet,
    amount,
    cChainBlockchainID,
    cAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    toThreshold,
    changeThreshold,
    assetID
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
