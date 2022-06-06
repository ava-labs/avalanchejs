import { SendResponse } from "avalanche/dist/apis/avm"

const main = async (): Promise<any> => {
  const sendResponse: SendResponse = {
    txID: "2wYzSintaK3NWk71CGBvzuieFeAzJBLYpwfypGwQMsyotcK8Zs",
    changeAddr: "X-avax1vwf7dg22l9c0lnt92kq3urf0h9j3x6296sue77"
  }
  console.log(sendResponse)
}

main()
