import { Avalanche, BN } from "avalanche/dist"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "avalanche/dist/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  UTXOSet
} from "avalanche/dist/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costImportTx
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
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
