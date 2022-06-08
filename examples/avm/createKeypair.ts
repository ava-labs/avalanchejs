import { Avalanche } from "avalanche/dist"
import { AVMAPI, KeyChain, KeyPair } from "avalanche/dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const keychain: KeyChain = xchain.keyChain()
  const keypair: KeyPair = keychain.makeKey()

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
