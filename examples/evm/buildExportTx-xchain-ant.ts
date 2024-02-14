import "dotenv/config"
import { Avalanche, BN } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costExportTx
} from "../../src/utils"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const cchain: EVMAPI = avalanche.CChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const xKeychain: AVMKeyChain = xchain.keyChain()
const cKeychain: EVMKeyChain = cchain.keyChain()
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const xChainBlockchainIdStr: string = Defaults.network[networkID].X.blockchainID
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const Web3 = require("web3")
const path: string = "/ext/bc/C/rpc"
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1
const assetID: string = "8eqonZUiJZ655TLQdhFDCqY8oV4SPDMPzqfoVMVsSNE4wSMWu"

const main = async (): Promise<any> => {
  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const baseFeeResponse: string = await cchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16))
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)
  let amount: BN = new BN(100)
  let fee: BN = baseFee

  let unsignedTx: UnsignedTx = await cchain.buildExportTx(
    amount,
    assetID,
    xChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    xAddressStrings,
    nonce,
    locktime,
    threshold,
    fee
  )
  const exportCost: number = costExportTx(unsignedTx)
  fee = baseFee.mul(new BN(exportCost))
  unsignedTx = await cchain.buildExportTx(
    amount,
    assetID,
    xChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    xAddressStrings,
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
