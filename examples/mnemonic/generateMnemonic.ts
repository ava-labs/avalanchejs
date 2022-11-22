import randomBytes from "randombytes"
import Mnemonic from "@c4tplatform/caminojs/dist/utils/mnemonic"
const mnemonic: Mnemonic = Mnemonic.getInstance()

const main = async (): Promise<any> => {
  const strength: number = 256
  const wordlist = mnemonic.getWordlists("czech") as string[]
  const m: string = mnemonic.generateMnemonic(
    strength,
    Buffer.from(randomBytes.toString()),
    wordlist
  )
  console.log(m)
}

main()
