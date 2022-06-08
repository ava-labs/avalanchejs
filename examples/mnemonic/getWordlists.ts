import Mnemonic from "avalanche/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  console.log(mnemonic.getWordlists("czech"))
  // console.log(mnemonic.getWordlists())
}

main()
