import { Serialization } from "../../src/utils"
import { SerializedType } from "../../src/utils"
import { SerializedEncoding } from "../../src/utils"

const base58Decoder = (item: string) => {
  const hexVal: string = serialization.decoder(item, base58, cb58, hex)
  return hexVal
}

const cb58: SerializedType = "cb58"
const base58: SerializedEncoding = "base58"
const hex: SerializedType = "hex"
const serialization: Serialization = Serialization.getInstance()

const main = async (): Promise<any> => {
  const base58: string = "2MJd1pvSzdvvFKk3aa6qCa4trgnRfjzNfkTCWHha6TxtthsNfd"

  const decoded: string = base58Decoder(base58)
  console.log("0x" + decoded)
}

main()
