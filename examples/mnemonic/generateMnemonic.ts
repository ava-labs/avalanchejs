import randomBytes from "randombytes"
import Mnemonic from "caminojs/utils/mnemonic"
import { Buffer } from "buffer/"

const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const strength: number = 256
  const wordlist = mnemonic.getWordlists("czech") as string[]
  const m: string = mnemonic.generateMnemonic(
    strength,
    (size: number) => Buffer.from(randomBytes(size)),
    wordlist
  )
  console.log(m)
}

main()
