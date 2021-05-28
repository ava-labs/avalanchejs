import { 
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src";
import {
  AVMAPI, 
  KeyChain as AVMKeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  ExportTx
} from "../../src/apis/avm"
import { Defaults } from "../../src/utils"
      
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const blockchainid: string = Defaults.network['12345'].X.blockchainID
const cChainBlockchainID: string = Defaults.network['12345'].C.blockchainID
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("Manually Export AVAX and ANT from X-Chain to C-Chain")
// Uncomment for codecID 00 01
// const codecID: number = 1
      
const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await xchain.getAVAXAssetID()
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    if(utxo.getOutput().getTypeID() != 6) {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    let amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    let assetID: Buffer = utxo.getAssetID()
    const outputidx: Buffer = utxo.getOutputIdx()
    let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput()
    if(avaxAssetID.toString("hex") === assetID.toString("hex")) {
      assetID = avaxAssetID
      secpTransferOutput = new SECPTransferOutput(amt.sub(fee), xAddresses, locktime, threshold)
    } else {
      secpTransferOutput = new SECPTransferOutput(amt, xAddresses, locktime, threshold)
    }
    // Uncomment for codecID 00 01
    // secpTransferOutput.setCodecID(codecID)
    const transferableOutput: TransferableOutput = new TransferableOutput(assetID, secpTransferOutput)
    exportedOuts.push(transferableOutput)
  
    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
  
    const input: TransferableInput = new TransferableInput(txid, outputidx, assetID, secpTransferInput)
    inputs.push(input)
    }
  })
  
  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(blockchainid),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(cChainBlockchainID),
    exportedOuts
  )
  // Uncomment for codecID 00 01
  // exportTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
    
main()
    