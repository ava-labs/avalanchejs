import Mnemonic from "@c4tplatform/caminojs/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const m: string =
    "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"
  const wordlist = mnemonic.getWordlists("english") as string[]
  const validateMnemonic = mnemonic.validateMnemonic(m, wordlist)
  console.log(validateMnemonic)
}
main()
