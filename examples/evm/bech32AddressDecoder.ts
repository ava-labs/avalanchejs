import { Buffer } from "../../src"
import * as bech32 from "bech32"
import { decode } from "base32-encoding"

const fromDecToHex = (item: number) => {
  let hexVal = item.toString(16)
  let hexString = hexVal.length < 2 ? "0" + hexVal : hexVal
  return hexString
}
const bech32Decoder = (item: string) => {
  let bech32Val = item.length === 45 ? item.split("C-").join("") : item
  //decode bech32 address into hrp and words
  let toWords = bech32.bech32.decode(bech32Val)
  //get buffer from words
  const bufFromWords = Buffer.from(toWords.words)
  //convert words array of unsigned integers from base32 (5-bit) to base256 (8-bit)
  var base256Converted = decode(bufFromWords)
  //get an array of unsigned integers from the buffer obtained
  let arrBase256Converted = [...base256Converted]
  //convert each integer to its hex value
  let hexValue = arrBase256Converted.map((item) => fromDecToHex(item))
  return "0x" + hexValue.toString().split(",").join("")
}

const main = async (): Promise<any> => {
  const txID: string = "C-avax1hwgqh0s6yrdy636xv6me5haxecfx99enh5278a"
  const bech32DecodedAddress = bech32Decoder(txID)
  console.log("Decoded address (0x format): " + bech32DecodedAddress)
}

main()
