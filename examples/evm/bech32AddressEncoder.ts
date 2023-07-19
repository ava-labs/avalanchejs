import * as bech32 from "bech32"
import { Buffer } from "../../src"

const fromDecToHex = (item: number) => {
  const hexVal = item.toString(16)
  return hexVal.length < 2 ? "0" + hexVal : hexVal
}
const bech32Encoder = (item: string) => {
  const hrp = "avax"
  const bufFromHex = Buffer.from(item.slice(2), "hex")
  const arrBuf = [...bufFromHex]
  const bech32Address = bech32.bech32.encode(hrp, bech32.bech32.toWords(arrBuf))
  const errorMessage =
    item.length > 42
      ? "Address too long. Enter a valid address"
      : item.length < 40
      ? "Address too short. Enter a valid address"
      : "Add 0x prefix to the address"
  return item.length === 42 ? "C-" + bech32Address : "Error. " + errorMessage
  //to get P and X chains format, just change the C- prefix to P- or X-
}

const main = async (): Promise<any> => {
  const address: string = "0xBB900BbE1A20dA4d474666B79a5fa6CE12629733"
  const encodedAddress = bech32Encoder(address)
  console.log("Bech32 encoded address: " + encodedAddress)
}

main()
