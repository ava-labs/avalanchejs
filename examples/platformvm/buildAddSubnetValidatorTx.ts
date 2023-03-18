import { Avalanche, BN, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "caminojs/apis/platformvm"
import { GetUTXOsResponse } from "caminojs/apis/platformvm/interfaces"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const startTime: BN = new BN(1652217329)
const endTime: BN = new BN(1653511017)
const asOf: BN = new BN(0)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddressStrings: string[]

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
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
  pKeychain.importKey(
    "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
  )
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: GetUTXOsResponse = await pchain.getUTXOs(
    pAddressStrings
  )
  const pAddresses: Buffer[] = pchain.keyChain().getAddresses()
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const weight: BN = new BN(1)
  const subnetID: string = "2tFRAeosSsgd1XV9Bn2y9VEHKPkeuk41RdnAZh9PuZJDWWkR5"
  const memo: Buffer = Buffer.from(
    "Utility function to create a AddSubnetValidatorTx transaction"
  )
  const subnetAuthCredentials: [number, Buffer][] = [
    [0, pAddresses[3]],
    [1, pAddresses[1]]
  ]
  const unsignedTx: UnsignedTx = await pchain.buildAddSubnetValidatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    weight,
    subnetID,
    memo,
    asOf,
    {
      addresses: [pAddresses[3], pAddresses[1]],
      threshold: 2,
      signer: subnetAuthCredentials
    }
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
