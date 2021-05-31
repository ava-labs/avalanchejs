import {
  BIP39,
  mnemonic
} from "../../src/utils"
const bip39: BIP39 = BIP39.getInstance()

const main = async (): Promise<any> => {
  const wordlist = bip39.getWordlists("EN") as string[]
  const mnemonicToEntropy: string = bip39.mnemonicToEntropy(mnemonic, wordlist)
  console.log(mnemonicToEntropy)
}

main()