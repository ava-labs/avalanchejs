import { Avalanche, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  AVMAPI,
  KeyChain as AVMKeyChain
} from "@c4tplatform/caminojs/dist/apis/avm"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
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

const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const cChainBlockchainID: string = avalanche.getNetwork().C.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildExportTx to export AVAX from the P-Chain to the C-Chain"
)
const asOf: BN = UnixNow()

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string

let xchain: AVMAPI
let xKeychain: AVMKeyChain
let xAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID

  xchain = avalanche.XChain()
  xKeychain = xchain.keyChain()
  xKeychain.importKey(privKey)
  xAddressStrings = xchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const getBalanceResponse: any = await pchain.getBalance({
    address: pAddressStrings[0]
  })
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await pchain.buildExportTx(
    utxoSet,
    unlocked.sub(fee),
    cChainBlockchainID,
    xAddressStrings,
    pAddressStrings,
    pAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
