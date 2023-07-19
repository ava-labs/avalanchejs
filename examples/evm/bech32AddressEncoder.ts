import { Buffer } from "../../src"
import * as bech32 from "bech32"

const fromDecToHex = (item: number) => {
  let hexVal = item.toString(16)
  let hexString = hexVal.length < 2 ? "0" + hexVal : hexVal
  return hexString
}
const bech32Encoder = (item: string) => {
  let hrp = "avax"
  const bufFromHex = Buffer.from(item.slice(2), "hex")
  let arrBuf = [...bufFromHex]
  let bech32Address = bech32.bech32.encode(hrp, bech32.bech32.toWords(arrBuf))
  return "C-" + bech32Address
  //to get P and X chains format, just change the C- prefix to P- or X-
}

const main = async (): Promise<any> => {
  const txID: string = "0xBB900BbE1A20dA4d474666B79a5fa6CE12629733"
  const encodedAddress = bech32Encoder(txID)
  console.log("Bech32 encoded address: " + encodedAddress)
}

main()
