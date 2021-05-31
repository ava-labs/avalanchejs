import { BIP39 } from "../../src/utils"
const bip39: BIP39 = BIP39.getInstance()

const main = async (): Promise<any> => {
  console.log(bip39.getWordlists("czech"))
  // console.log(bip39.getWordlists())
}

main()