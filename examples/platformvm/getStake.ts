import { 
  Avalanche
} from "../../src"
import {
  PlatformVMAPI, 
  KeyChain
} from "../../src/apis/platformvm"
      
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
pKeychain.importKey(privKey)
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
   
const main = async (): Promise<any> => {
  const txid: string = await pchain.getStake(pAddressStrings)
  console.log(`Success! TXID: ${txid}`)
}
    
main()
    