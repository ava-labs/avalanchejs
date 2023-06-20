// using https://www.npmjs.com/package/@noble/bls12-381
// import { getPublicKey, sign, verify } from "@noble/bls12-381"
import { Avalanche, Buffer } from "caminojs/index"
import {
  KeyChain,
  KeyPair,
  PlatformVMAPI,
  ProofOfPossession
} from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"

// start placeholder functions
const getPublicKey = (privateKey): Buffer => {
  return new Buffer("00")
}
const sign = (publicKey, privateKey): Buffer => {
  return new Buffer("00")
}
const verify = (signature, message, publicKey): boolean => {
  return true
}
// end placeholder functions

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
let pchain: PlatformVMAPI = avalanche.PChain()
let keychain: KeyChain = pchain.keyChain()
let keypair: KeyPair = keychain.makeKey()

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  keychain = pchain.keyChain()
  keypair = keychain.makeKey()
}
const main = async (): Promise<any> => {
  await InitAvalanche()
  const privateKey: string = keypair.getPrivateKey().toString("hex")
  // 48 byte public key
  const publicKey = getPublicKey(privateKey) as Buffer
  // 96 byte signature
  const signature = (await sign(publicKey, privateKey)) as Buffer
  const proofOfPossession: ProofOfPossession = new ProofOfPossession(
    publicKey,
    signature
  )
  const isValid: boolean = await verify(signature, publicKey, publicKey)
  console.log(isValid)
  const pubKey: Buffer = proofOfPossession.getPublicKey()
  const sig: Buffer = proofOfPossession.getSignature()
  console.log(`Public Key:`, pubKey === publicKey)
  console.log(`Signature:`, sig === signature)
}

main()
