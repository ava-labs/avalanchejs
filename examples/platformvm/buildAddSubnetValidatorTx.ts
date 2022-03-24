import { Avalanche, BinTools, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  SubnetAuth
} from "../../src/apis/platformvm"
import { GetUTXOsResponse } from "../../src/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const nodeID: string = "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"
const startTime: BN = new BN(1648111848)
const endTime: BN = new BN(1649407730)

const main = async (): Promise<any> => {
  const platformVMUTXOResponse: GetUTXOsResponse = await pchain.getUTXOs(
    pAddressStrings
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const weight: BN = new BN(20)
  const subnetID: Buffer = bintools.cb58Decode(
    "WYziRrZeZVftQ56QizLxmSfwofLyJM8u3uYbRHA1Yc7YtMmbN"
  )
  const addressIndex: Buffer = Buffer.alloc(4)
  addressIndex.writeUIntBE(0x0, 0, 4)
  const subnetAuth: SubnetAuth = new SubnetAuth([addressIndex])
  const unsignedTx: UnsignedTx = await pchain.buildAddSubnetValidatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    weight,
    subnetID,
    subnetAuth
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
