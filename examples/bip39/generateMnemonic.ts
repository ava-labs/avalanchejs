import { Wordlist } from "ethers"
import { randomBytes } from "randombytes"
import { BIP39 } from "../../src/utils"
const bip39: BIP39 = BIP39.getInstance()

const main = async (): Promise<any> => {
  const strength: number = 256
  const wordlist = bip39.getWordlists("czech") as Wordlist
  const mnemonic: string = bip39.generateMnemonic(strength, randomBytes, wordlist)
  console.log(mnemonic)
}

main()