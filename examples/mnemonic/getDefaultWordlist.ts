import Mnemonic from "@c4tplatform/caminojs/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  mnemonic.setDefaultWordlist("japanese")
  const getDefaultWordlist: string = mnemonic.getDefaultWordlist()
  console.log(getDefaultWordlist)
}
main()
