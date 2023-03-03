import Mnemonic from "caminojs/utils/mnemonic"
import { Buffer } from "caminojs/index"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const m: string =
    "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"
  const password: string = "password"
  const mnemonicToSeed: Buffer = await mnemonic.mnemonicToSeed(m, password)
  console.log(mnemonicToSeed)
}
main()
