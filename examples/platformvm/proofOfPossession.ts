const bls = require("@noble/bls12-381")
import { Avalanche, Buffer } from "../../src"
import {
  KeyChain,
  KeyPair,
  PlatformVMAPI,
  ProofOfPossession
} from "../../src/apis/platformvm"

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
  const publicKey: Buffer = bls.getPublicKey(privateKey)
  // 96 byte signature
  const signature: Buffer = await bls.sign(publicKey, privateKey)
  const proofOfPossession: ProofOfPossession = new ProofOfPossession(
    publicKey,
    signature
  )
  console.log(`Proof of Possession:`, proofOfPossession)
  const isValid = await bls.verify(signature, publicKey, publicKey)
  console.log(isValid)
  const pubKey: Buffer = proofOfPossession.getPublicKey()
  const sig: Buffer = proofOfPossession.getSignature()
  console.log(`Public Key:`, pubKey === publicKey)
  console.log(`Signature:`, sig === signature)
}

main()
