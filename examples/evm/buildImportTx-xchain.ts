import { 
  Avalanche,
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
  UTXOSet
} from "../../src/apis/evm"
import { Defaults } from "../../src/utils"
          
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const cchain: EVMAPI = avalanche.CChain()
const xKeychain: AVMKeyChain = xchain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
const cKeychain: KeyChain = cchain.keyChain()
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const xChainBlockchainId: string = Defaults.network['12345'].X.blockchainID
          
const main = async (): Promise<any> => {
  const evmUTXOResponse: any = await cchain.getUTXOs(cAddressStrings, xChainBlockchainId)
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
      
  const unsignedTx: UnsignedTx = await cchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    xChainBlockchainId,
    cAddressStrings
  )
  
  const tx: Tx = unsignedTx.sign(cKeychain)
  const id: string = await cchain.issueTx(tx)
  console.log(id)
}
        
main()