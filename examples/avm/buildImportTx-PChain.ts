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
  Tx
} from "../../src/apis/avm"
import { Defaults, UnixNow } from "../../src/utils"
        
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
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const pChainBlockchainID: string = Defaults.network['12345'].P.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from("AVM utility method buildImportTx to import AVAX to the X-Chain from the P-Chain")
        
const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings, pChainBlockchainID)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
    
  const unsignedTx: UnsignedTx = await xchain.buildImportTx(
    utxoSet,
    xAddressStrings,
    pChainBlockchainID,
    xAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
      
main()
      