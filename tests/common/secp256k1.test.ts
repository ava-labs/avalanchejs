import { Buffer } from "buffer/"
import BinTools from "../../src/utils/bintools"
import { KeyPair } from "src/apis/evm"

const bintools: BinTools = BinTools.getInstance()

describe("SECP256K1", (): void => {
  test("addressFromPublicKey", (): void => {
    const pubkeys: string[] = [
      "7ECaZ7TpWLq6mh3858DkR3EzEToGi8iFFxnjY5hUGePoCHqdjw",
      "5dS4sSyL4dHziqLYanMoath8dqUMe6ZkY1VbnVuQQSsCcgtVET"
    ]
    const addrs: string[] = [
      "b0c9654511ebb78d490bb0d7a54997d4a933972c",
      "d5bb99a29e09853da983be63a76f02259ceedf15"
    ]
    pubkeys.forEach((pubkey: string, index: number): void => {
      const pubkeyBuf: Buffer = bintools.cb58Decode(pubkey)
      const addrBuf: Buffer = KeyPair.addressFromPublicKey(pubkeyBuf)
      expect(addrBuf.toString("hex")).toBe(addrs[index])
    })
  })
})
