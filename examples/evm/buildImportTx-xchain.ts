import "dotenv/config"
import { Avalanche, BN } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
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
const xchain: AVMAPI = avalanche.XChain()
const cchain: EVMAPI = avalanche.CChain()
const xKeychain: AVMKeyChain = xchain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const cKeychain: EVMKeyChain = cchain.keyChain()
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const xChainBlockchainId: string = Defaults.network[networkID].X.blockchainID

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  let fee: BN = baseFee
  const evmUTXOResponse: any = await cchain.getUTXOs(
    cAddressStrings,
    xChainBlockchainId
  )
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
  let unsignedTx: UnsignedTx = await cchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    xChainBlockchainId,
    cAddressStrings,
    fee
  )
  const importCost: number = costImportTx(unsignedTx)
  fee = baseFee.mul(new BN(importCost))

  unsignedTx = await cchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    xChainBlockchainId,
    cAddressStrings,
    fee
  )

  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
