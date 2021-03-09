import { 
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src";
import {
  PlatformVMAPI, 
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
} from "../../src/apis/platformvm"
import { UnixNow } from "../../src/utils";
      
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const bintools: BinTools = BinTools.getInstance()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const threshold: number = 1
const memo: Buffer = Buffer.from("PlatformVM utility method buildCreateSubnetTx to create a new subnet")
const asOf: BN = UnixNow()
 
const main = async (): Promise<any> => {
  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await pchain.buildCreateSubnetTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    threshold,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
  
main()
  