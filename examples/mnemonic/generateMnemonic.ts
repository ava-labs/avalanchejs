import { randomBytes } from "randombytes"
import Mnemonic from "avalanche/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const strength: number = 256
  const wordlist = mnemonic.getWordlists("czech") as string[]
  const m: string = mnemonic.generateMnemonic(strength, randomBytes, wordlist)
  console.log(m)
}

main()
