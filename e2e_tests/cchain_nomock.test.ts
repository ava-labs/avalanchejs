import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"

describe("CChain", (): void => {
  const avalanche = getAvalanche()
  const cchain = avalanche.CChain()

  // test_name        response_promise                            resp_fn          matcher           expected_value/obtained_value
  const tests_spec: any = [
    ["getBaseFee", () => cchain.getBaseFee(), (x) => x, Matcher.toBe, () => "0x34630b8a00"],
    ["getMaxPriorityFeePerGas", () => cchain.getMaxPriorityFeePerGas(), (x) => x, Matcher.toBe, () => "0x0"],
  ]

  createTests(tests_spec)

})
