import { 
  Avalanche, BinTools, BN, Buffer
} from "../../src"
import { 
  AVMAPI, 
  KeyChain as AVMKeyChain 
} from "../../src/apis/avm"
import {
  EVMAPI, 
  KeyChain,
  UnsignedTx, 
  Tx
} from "../../src/apis/evm"
import { Defaults } from "../../src/utils"
          
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const cchain: EVMAPI = avalanche.CChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
const cKeychain: KeyChain = cchain.keyChain()
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const xChainBlockchainIdStr: string = Defaults.network['12345'].X.blockchainID
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const Web3 = require('web3');
const path: string = '/ext/bc/C/rpc'
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1
          
const main = async (): Promise<any> => {
  let balance: BN = await web3.eth.getBalance(cHexAddress)
  const fee: BN = cchain.getDefaultTxFee()
  balance = new BN(balance.toString().substring(0, 17))
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount;
  const locktime: BN = new BN(0)
  const amount: BN = new BN(500)
  const assetID: string = "2DLukZZms6BdwsUea4DtWHReGa6reRw3QWGJfC7z5p7tqHCSxK"
      
  const unsignedTx: UnsignedTx = await cchain.buildExportTx(
    amount,
    assetID,
    xChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    xAddressStrings,
    nonce,
    locktime,
    threshold,
  )
  
  const tx: Tx = unsignedTx.sign(cKeychain)
  const id: string = await cchain.issueTx(tx)
  console.log(id)
}
        
main()