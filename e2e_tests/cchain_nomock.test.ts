import Avalanche from "../src"
import { EVMAPI } from "../src/apis/evm"
import { getAvalanche, createTests, Matcher } from "./e2etestlib"

describe("CChain", (): void => {
  const avalanche: Avalanche = getAvalanche()
  const cchain: EVMAPI = avalanche.CChain()

  // test_name        response_promise                            resp_fn          matcher           expected_value/obtained_value
  const tests_spec: any[] = [
    ["getBaseFee", () => cchain.getBaseFee(), (x: string) => x, Matcher.toBe, () => "0x34630b8a00"],
    ["getMaxPriorityFeePerGas", () => cchain.getMaxPriorityFeePerGas(), (x: string) => x, Matcher.toBe, () => "0x0"],
  ]

  createTests(tests_spec)

})
