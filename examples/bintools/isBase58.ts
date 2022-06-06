import { BinTools } from "avalanche/dist"
const bintools: BinTools = BinTools.getInstance()
const validBase581: string = "isGvtnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcH9oXb"
const validBase582: string =
  "2PwX8qwMHbwVAm28howu3Ef7Lk4ib2XG7AaY9aK8dTTGNXQkCz"
const invalidBase581: string =
  "ddd.tnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcHzzzz"
const invalidBase582: string = ""

const main = async (): Promise<any> => {
  console.log(`validBase581 is ${bintools.isBase58(validBase581)}`)
  console.log(`validBase582 is ${bintools.isBase58(validBase582)}`)
  console.log(`invalidBase581 is ${bintools.isBase58(invalidBase581)}`)
  console.log(`invalidBase582 is ${bintools.isBase58(invalidBase582)}`)
}

main()
