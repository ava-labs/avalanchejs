import {
  BIP39,
  mnemonic
} from "../../src/utils"
import { Buffer } from "../../src"
const bip39: BIP39 = BIP39.getInstance()

const main = async (): Promise<any> => {
  const password: string = "password"
  const mnemonicToSeed: Buffer = bip39.mnemonicToSeed(mnemonic, password)
  console.log(mnemonicToSeed)
}
main()