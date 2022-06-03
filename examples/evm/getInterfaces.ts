import { GetAtomicTxParams } from "avalanche/dist/apis/evm"

const main = async (): Promise<any> => {
  const getAtomicTxParams: GetAtomicTxParams = {
    txID: "2wYzSintaK3NWk71CGBvzuieFeAzJBLYpwfypGwQMsyotcK8Zs"
  }
  console.log(getAtomicTxParams)
}

main()
