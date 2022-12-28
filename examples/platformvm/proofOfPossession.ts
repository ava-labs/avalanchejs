// using https://www.npmjs.com/package/@noble/bls12-381
// import { getPublicKey, sign, verify } from "@noble/bls12-381"
import { Avalanche, Buffer } from "../../src"
import {
  KeyChain,
  KeyPair,
  PlatformVMAPI,
  ProofOfPossession
} from "../../src/apis/platformvm"

// start placeholder functions
const getPublicKey = (privateKey): Buffer => {return new Buffer("00")}
const sign = (publicKey, privateKey): Buffer => {return new Buffer("00")}
const verify = (signature, message, publicKey): boolean => {return true}
// end placeholder functions

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()
const keychain: KeyChain = pchain.keyChain()
const keypair: KeyPair = keychain.makeKey()

const main = async (): Promise<any> => {
  const privateKey: string = keypair.getPrivateKey().toString("hex")
  // 48 byte public key
  const publicKey = getPublicKey(privateKey) as Buffer
  // 96 byte signature
  const signature = await sign(publicKey, privateKey) as Buffer
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
