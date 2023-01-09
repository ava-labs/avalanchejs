import { Avalanche, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import { GetUTXOsResponse } from "@c4tplatform/caminojs/dist/apis/platformvm/interfaces"
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

let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const threshold: number = 2
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildCreateSubnetTx to create a CreateSubnetTx which creates a 1-of-2 AVAX utxo and a 2-of-3 SubnetAuth"
)
const asOf: BN = new BN(0)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]
let subnetAuthKeychain: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // P-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
  pKeychain.importKey(privKey)
  // P-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
  pKeychain.importKey(
    "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  )
  // P-local1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
  pKeychain.importKey(
    "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
  )
  // P-local1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
  pAddressStrings = pchain.keyChain().getAddressStrings()
  subnetAuthKeychain = [
    pAddressStrings[1],
    pAddressStrings[2],
    pAddressStrings[3]
  ]
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: GetUTXOsResponse = await pchain.getUTXOs(
    pAddressStrings
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await pchain.buildCreateSubnetTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    subnetAuthKeychain,
    threshold,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
