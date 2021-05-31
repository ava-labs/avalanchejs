import { 
  Avalanche,
  Buffer 
} from "../../src"
import { 
  AVMAPI, 
  KeyChain,
  KeyPair 
} from "../../src/apis/avm"
import { PrivateKeyPrefix, DefaultLocalGenesisPrivateKey } from "../../src/utils"
  
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const keychain: KeyChain = xchain.keyChain()
const keypair: KeyPair = keychain.getKey(xAddresses[0])
 
const main = async (): Promise<any> => {
  const keychain: KeyChain = xchain.keyChain()

  const response: {
    address: string
    publicKey: string
    privateKey: string
  } = {
    address: keypair.getAddressString(),
    publicKey: keypair.getPublicKeyString(),
    privateKey: keypair.getPrivateKeyString()
  }
  console.log(response)
}
    
main()
  