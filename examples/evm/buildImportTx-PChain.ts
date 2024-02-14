import "dotenv/config"
import { Avalanche, BN } from "../../src"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "../../src/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  UTXOSet
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costImportTx
} from "../../src/utils"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const cchain: EVMAPI = avalanche.CChain()
const pKeychain: PlatformVMKeyChain = pchain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const cKeychain: EVMKeyChain = cchain.keyChain()
pKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const pChainBlockchainId: string = Defaults.network[networkID].P.blockchainID

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  let fee: BN = baseFee
  const evmUTXOResponse: any = await cchain.getUTXOs(
    cAddressStrings,
    pChainBlockchainId
  )
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
  let unsignedTx: UnsignedTx = await cchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    pChainBlockchainId,
    cAddressStrings,
    fee
  )
  const importCost: number = costImportTx(unsignedTx)
  fee = baseFee.mul(new BN(importCost))

  unsignedTx = await cchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    pChainBlockchainId,
    cAddressStrings,
    fee
  )

  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
