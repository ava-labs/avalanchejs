import { BIP39 } from "../../src/utils"
const bip39: BIP39 = BIP39.getInstance()

const main = async (): Promise<any> => {
  const wordlist = bip39.getWordlists("EN") as string[]
  const entropy: string = "9d7c99e77261acb88a5ed717f625d5d3ed5569e0f60429cc6eb9c4e91f48fb7c"
  const entropyToMnemonic: string = bip39.entropyToMnemonic(entropy, wordlist)
  console.log(entropyToMnemonic)
}

main()