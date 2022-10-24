import Mnemonic from "@c4tplatform/caminojs/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  console.log(mnemonic.getWordlists("czech"))
  // console.log(mnemonic.getWordlists())
}

main()
