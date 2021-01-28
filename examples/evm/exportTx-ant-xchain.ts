import { 
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src"
import { 
  AVMAPI, 
  KeyChain as AVMKeyChain 
} from "../../src/apis/avm"
import {
  EVMAPI, 
  KeyChain,
  UnsignedTx, 
  Tx,
  EVMInput,
  ExportTx,
  SECPTransferOutput,
  TransferableOutput
} from "../../src/apis/evm"
import { RequestResponseData } from "../../src/common"
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
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()
const xChainBlockchainIdStr: string = Defaults.network['12345'].X.blockchainID
const xChainBlockchainIdBuf: Buffer = bintools.cb58Decode(xChainBlockchainIdStr)
const cChainBlockchainIdStr: string = Defaults.network['12345'].C.blockchainID
const cChainBlockchainIdBuf: Buffer = bintools.cb58Decode(cChainBlockchainIdStr)
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const evmInputs: EVMInput[] = []
let exportedOuts: TransferableOutput[] = []
const Web3 = require('web3');
const path: string = '/ext/bc/C/rpc'
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1
        
const main = async (): Promise<any> => {
  const avaxAssetIDBuf: Buffer = await xchain.getAVAXAssetID()
  const avaxAssetIDStr: string = bintools.cb58Encode(avaxAssetIDBuf)
  const antAssetIDStr: string = "verma4Pa9biWKbjDGNsTXU47cYCyDSNGSU1iBkxucfVSFVXdv"
  const antAssetIDBuf: Buffer = bintools.cb58Decode(antAssetIDStr)
  const antAssetBalanceResponse: RequestResponseData = await cchain.callMethod("eth_getAssetBalance", [
    cHexAddress,
    "latest",
    antAssetIDStr
  ], "ext/bc/C/rpc")
  const antAssetBalance: number = parseInt(antAssetBalanceResponse.data.result, 16)
  let avaxBalance: BN = await web3.eth.getBalance(cHexAddress)
  avaxBalance = new BN(avaxBalance.toString().substring(0, 17))
  const fee: BN = cchain.getDefaultTxFee()
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount;
  const locktime: BN = new BN(0)
    
  let evmInput: EVMInput = new EVMInput(cHexAddress, avaxBalance, avaxAssetIDStr, nonce)
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)
    
  evmInput = new EVMInput(cHexAddress, antAssetBalance, antAssetIDStr, nonce)
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)
    
  let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(avaxBalance.sub(fee), xAddresses, locktime, threshold)
  let transferableOutput: TransferableOutput = new TransferableOutput(avaxAssetIDBuf, secpTransferOutput)
  exportedOuts.push(transferableOutput)

  secpTransferOutput = new SECPTransferOutput(new BN(antAssetBalance), xAddresses, locktime, threshold)
  transferableOutput = new TransferableOutput(antAssetIDBuf, secpTransferOutput)
  exportedOuts.push(transferableOutput)
  exportedOuts = exportedOuts.sort(TransferableOutput.comparator());
    
  const exportTx: ExportTx = new ExportTx(
    networkID,
    cChainBlockchainIdBuf,
    xChainBlockchainIdBuf,
    evmInputs,
    exportedOuts
  )
      
  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(cKeychain)
  const id: string = await cchain.issueTx(tx)
  console.log(id)
}
      
main()