import { BinTools } from "avalanche/dist"
const bintools: BinTools = BinTools.getInstance()
const validCB581: string = "isGvtnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcH9oXb"
const validCB582: string = "2PwX8qwMHbwVAm28howu3Ef7Lk4ib2XG7AaY9aK8dTTGNXQkCz"
const invalidCB581: string = "ddd.tnDqETNmmFw7guSJ7mmWhCqboExrpmC8VsWxckHcHzzzz"
const invalidCB582: string = ""

const main = async (): Promise<any> => {
  console.log(`validCB581 is ${bintools.isCB58(validCB581)}`)
  console.log(`validCB582 is ${bintools.isCB58(validCB582)}`)
  console.log(`invalidCB581 is ${bintools.isCB58(invalidCB581)}`)
  console.log(`invalidCB582 is ${bintools.isCB58(invalidCB582)}`)
}

main()
