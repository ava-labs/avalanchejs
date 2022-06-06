import Mnemonic from "../../src/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const lang: string = "spanish"
  mnemonic.setDefaultWordlist(lang)
}
main()
