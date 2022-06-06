import { Avalanche, BN } from "avalanche/dist"
import {
  PlatformVMAPI,
  KeyChain as PlatformKeyChain
} from "avalanche/dist/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx
} from "avalanche/dist/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costExportTx
} from "avalanche/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const cchain: EVMAPI = avalanche.CChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const pKeychain: PlatformKeyChain = pchain.keyChain()
const cKeychain: EVMKeyChain = cchain.keyChain()
pKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const pChainBlockchainIdStr: string = Defaults.network[networkID].P.blockchainID
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const Web3 = require("web3")
const path: string = "/ext/bc/C/rpc"
const web3: any = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1

const main = async (): Promise<any> => {
  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16))
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)
  let avaxAmount: BN = new BN(1e7)
  let fee: BN = baseFee.div(new BN(1e9))
  fee = fee.add(new BN(1e6))

  let unsignedTx: UnsignedTx = await cchain.buildExportTx(
    avaxAmount,
    avaxAssetID,
    pChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    pAddressStrings,
    nonce,
    locktime,
    threshold,
    fee
  )

  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await cchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
