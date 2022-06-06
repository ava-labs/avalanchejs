import { BinTools } from "avalanche/dist"
const bintools: BinTools = BinTools.getInstance()
const validHex1: string =
  "0x95eaac2b7a6ee7ad7e597c2f5349b03e461c36c2e1e50fc98a84d01612940bd5"
const validHex2: string =
  "95eaac2b7a6ee7ad7e597c2f5349b03e461c36c2e1e50fc98a84d01612940bd5"
const invalidHex1: string =
  "rrrrr.c2b7a6ee7ad7e597c2f5349b03e461c36c2e1e5.fc98a84d016129zzzzz"
const invalidHex2: string = ""

const main = async (): Promise<any> => {
  console.log(`validHex1 is ${bintools.isHex(validHex1)}`)
  console.log(`validHex2 is ${bintools.isHex(validHex2)}`)
  console.log(`invalidHex1 is ${bintools.isHex(invalidHex1)}`)
  console.log(`invalidHex2 is ${bintools.isHex(invalidHex2)}`)
}

main()
