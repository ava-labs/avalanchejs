import { Avalanche } from "caminojs/index"
import { EVMAPI, KeyChain, KeyPair } from "caminojs/apis/evm"
import { CreateKeyPairResponse } from "caminojs/apis/evm/interfaces"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const keychain: KeyChain = cchain.keyChain()
  const keypair: KeyPair = keychain.makeKey()
  const address: string = keypair.getAddressString()
  const publicKey: string = keypair.getPublicKeyString()
  const privateKey: string = keypair.getPrivateKeyString()
  const createKeypairResponse: CreateKeyPairResponse = {
    address: address,
    publicKey: publicKey,
    privateKey: privateKey
  }
  console.log(createKeypairResponse)
}

main()
