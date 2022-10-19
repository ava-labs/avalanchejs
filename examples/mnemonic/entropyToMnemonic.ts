import Mnemonic from "avalanche/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const wordlist = mnemonic.getWordlists("EN") as string[]
  const entropy: string =
    "9d7c99e77261acb88a5ed717f625d5d3ed5569e0f60429cc6eb9c4e91f48fb7c"
  const entropyToMnemonic: string = mnemonic.entropyToMnemonic(
    entropy,
    wordlist
  )
  console.log(entropyToMnemonic)
}

main()
