import Mnemonic from "../../src/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  mnemonic.setDefaultWordlist("japanese")
  const getDefaultWordlist: string = mnemonic.getDefaultWordlist()
  console.log(getDefaultWordlist)
}
main()
