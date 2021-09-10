import { Avalanche } from "../../src"
import { AVMAPI, KeyChain, KeyPair } from "../../src/apis/avm"

// const ip: string = "localhost"
// const port: number = 9650
// const protocol: string = "http"
// const networkID: number = 12345

const ip: string = "api.avax.network"
const port: number = 443
const protocol: string = "https"
const networkID: number = 1

const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const keychain: KeyChain = xchain.keyChain()
  const keypair: KeyPair = keychain.makeKey()

  console.log("keypair", keypair)

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
