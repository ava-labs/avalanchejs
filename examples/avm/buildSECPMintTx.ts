import { 
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src";
import {
  AVMAPI, 
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  SECPMintOutput,
  AVMConstants,
  SECPTransferOutput,
  UTXO
} from "../../src/apis/avm"
import { UnixNow } from "../../src/utils";
  
const getUTXOIDs = (utxoSet: UTXOSet, txid: string, outputType: number = AVMConstants.SECPXFEROUTPUTID_CODECONE, assetID = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"): string[] => {
  const utxoids: string[] = utxoSet.getUTXOIDs()
  let result: string[] = []
  for (let index: number = 0; index < utxoids.length; ++index) {
    if (utxoids[index].indexOf(txid.slice(0,10)) != -1 && utxoSet.getUTXO(utxoids[index]).getOutput().getOutputID() == outputType && assetID == bintools.cb58Encode(utxoSet.getUTXO(utxoids[index]).getAssetID())) {
      result.push(utxoids[index])
    }
  }
  return result
}
      
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM utility method buildSECPMintTx to mint an ANT")
const asOf: BN = UnixNow()
      
const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let mintUTXOID: string = "" 
  let mintOwner: SECPMintOutput = new SECPMintOutput() 
  let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput()
  let txid: Buffer = Buffer.from("")
  let assetID: Buffer = Buffer.from("")
  utxos.forEach((utxo: UTXO) => {
    if(utxo.getOutput().getTypeID() === 6) {
      txid = utxo.getTxID()
      assetID = utxo.getAssetID()
    }
  })
  const secpMintOutputUTXOIDs: string[] = getUTXOIDs(utxoSet, bintools.cb58Encode(txid), AVMConstants.SECPMINTOUTPUTID, bintools.cb58Encode(assetID))
  mintUTXOID = secpMintOutputUTXOIDs[0]
  const utxo: UTXO = utxoSet.getUTXO(secpMintOutputUTXOIDs[0])
  mintOwner = utxo.getOutput() as SECPMintOutput
  const amount: BN = new BN(54321)
  secpTransferOutput = new SECPTransferOutput(amount, xAddresses, locktime, threshold)
  
  const unsignedTx: UnsignedTx = await xchain.buildSECPMintTx(
    utxoSet,
    mintOwner,
    secpTransferOutput,
    xAddressStrings,
    xAddressStrings,
    mintUTXOID,
    memo,
    asOf
  )
  
  const tx: Tx = unsignedTx.sign(xKeychain)
  const id: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}
    
main()
    