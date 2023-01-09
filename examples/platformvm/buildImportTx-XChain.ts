import { Avalanche, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
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
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildImportTx to import AVAX to the P-Chain from the X-Chain"
)
const asOf: BN = new BN(0)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]
let pChainBlockchainID: string
let xChainBlockchainID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddressStrings = pchain.keyChain().getAddressStrings()
  xChainBlockchainID = avalanche.getNetwork().X.blockchainID
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: any = await pchain.getUTXOs(
    pAddressStrings,
    pChainBlockchainID
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await pchain.buildImportTx(
    utxoSet,
    pAddressStrings,
    xChainBlockchainID,
    pAddressStrings,
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
