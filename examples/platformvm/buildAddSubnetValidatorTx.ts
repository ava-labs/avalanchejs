import { Avalanche, BN, Buffer } from "avalanche/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "avalanche/dist/apis/platformvm"
import { GetUTXOsResponse } from "avalanche/dist/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
// Keychain with 4 keys-A, B, C, and D
const pKeychain: KeyChain = pchain.keyChain()
// Keypair A
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// P-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
pKeychain.importKey(privKey)

// Keypair B
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
pKeychain.importKey(privKey)

// Keypair C
privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
pKeychain.importKey(privKey)

// Keypair D
privKey = "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
// P-custom1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const startTime: BN = new BN(1652217329)
const endTime: BN = new BN(1653511017)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
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
    subnetAuthCredentials
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
