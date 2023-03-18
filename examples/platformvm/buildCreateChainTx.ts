import { Avalanche, BinTools, BN, Buffer, GenesisData } from "caminojs/index"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "caminojs/apis/platformvm"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"

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
const bintools: BinTools = BinTools.getInstance()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const asOf: BN = new BN(0)

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
  // P-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
  pKeychain.importKey(
    "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
  )
  // P-local1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
  pKeychain.importKey(
    "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
  )
  // P-local1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const genesisDataStr: string =
    "11111DdZMhYXUZiFV9FNpfpTSQroysjHyMuT5zapYkPYrmap7t7S3sDNNwFzngxR9x1XmoRj5JK1XomX8RHvXYY5h3qYeEsMQRF8Ypia7p1CFHDo6KGSjMdiQkrmpvL8AvoezSxVWKXt2ubmBCnSkpPjnQbBSF7gNg4sPu1PXdh1eKgthaSFREqqG5FKMrWNiS6U87kxCmbKjkmBvwnAd6TpNx75YEiS9YKMyHaBZjkRDNf6Nj1"
  const subnetIDStr: string =
    "2cXEvbdDaP6q6srB6x1T14raebpJaM4s2t9NE5kiXzLqLXQDWm"
  const memo: Buffer = Buffer.from(
    "Utility function to create a CreateChainTx transaction"
  )
  const subnetID: Buffer = bintools.cb58Decode(subnetIDStr)
  const chainName: string = "EPIC AVM"
  const vmID: string = "avm"
  const fxIDs: string[] = ["secp256k1fx", "nftfx", "propertyfx"]

  // Only for AVM serialization. For other VMs comment these 2 lines
  const genesisData: GenesisData = new GenesisData()
  genesisData.fromBuffer(bintools.cb58Decode(genesisDataStr))

  // For VMs other than AVM. For AVM comment this line
  // const genesisData = genesisDataStr
  const subnetAuthCredentials: [number, Buffer][] = [
    [0, pAddresses[3]],
    [1, pAddresses[1]]
  ]

  const unsignedTx: UnsignedTx = await pchain.buildCreateChainTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    subnetID,
    chainName,
    vmID,
    fxIDs,
    genesisData,
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
