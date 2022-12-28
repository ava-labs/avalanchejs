import { Buffer } from "buffer/"
import { ProofOfPossession } from "../../../src/apis/platformvm"

describe("ProofOfPossession", (): void => {
  // publicKey and signature generated with: https://www.npmjs.com/package/@noble/bls12-381
  const publicKey: string = "a38ef4a5ec3177db895065ad751c7f24ea44c8ccafd5b892782a22d793df8fda6cd92787ff352b73ca8fe9f153e9760b"
  const publicKeyBuffer: Buffer = Buffer.from(publicKey, "hex")
  const signature: string = "a38aa4e58c67c2092c72bc03780e6f575b6f626bc9133c30a38817282b2764ecea49f77c22fc909a441f653e0c92290a148338b2f903d35939f6bef281bed0e333d9b6ebfa49891b1bac5df4378b06d569c877439cdbe0534268682adc00cb88"
  const signatureBuffer: Buffer = Buffer.from(signature, "hex")
  const proofOfPossession: ProofOfPossession = new ProofOfPossession(
    publicKeyBuffer,
    signatureBuffer
  )

  test("get public key", async (): Promise<void> => {
    const pubKey: Buffer = proofOfPossession.getPublicKey()
    expect(pubKey).toBe(publicKeyBuffer)
    const pubKeyHex: string = Buffer.from(pubKey).toString('hex')
    expect(pubKeyHex).toBe(publicKey)
  })

  test("get signature", async (): Promise<void> => {
    const sig: Buffer = proofOfPossession.getSignature()
    expect(sig).toBe(signatureBuffer)
    const sigHex: string = Buffer.from(sig).toString('hex')
    expect(sigHex).toBe(signature)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buff: Buffer = proofOfPossession.toBuffer()
    const prfOfPossession: ProofOfPossession = new ProofOfPossession()
    prfOfPossession.fromBuffer(buff)
    const buff2: Buffer = prfOfPossession.toBuffer()
    expect(buff).toStrictEqual(buff2)
  })
})
