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
  CreateAssetTx,
  SECPMintOutput,
  InitialStates
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
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM manual CreateAssetTx to create an ANT")
const name: string = "TestToken"
const symbol: string = "TEST"
const denomination: number = 3
// Uncomment for codecID 00 01
// const codecID: number = 1
      
const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await xchain.getAVAXAssetID()
  const getBalanceResponse: any = await xchain.getBalance(xAddressStrings[0], bintools.cb58Encode(avaxAssetID))
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(balance.sub(fee), xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(avaxAssetID, secpTransferOutput)
  outputs.push(transferableOutput)
  
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
  
    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
  
    const input: TransferableInput = new TransferableInput(txid, outputidx, avaxAssetID, secpTransferInput)
    inputs.push(input)
  })
  
  const amount: BN = new BN(507)
  const vcapSecpOutput = new SECPTransferOutput(amount, xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // vcapSecpOutput.setCodecID(codecID)
  const secpMintOutput: SECPMintOutput = new SECPMintOutput(xAddresses, locktime, threshold)
  // Uncomment for codecID 00 01
  // secpMintOutput.setCodecID(codecID)
  
  const initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)
  initialStates.addOutput(secpMintOutput)
  
  const createAssetTx: CreateAssetTx = new CreateAssetTx(
    networkID,
    bintools.cb58Decode(blockchainid),
    outputs,
    inputs,
    memo,
    name,
    symbol,
    denomination,
    initialStates
  )
  // Uncomment for codecID 00 01
  // createAssetTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(createAssetTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
    
main()
  