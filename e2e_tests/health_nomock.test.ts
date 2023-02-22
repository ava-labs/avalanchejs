import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { HealthAPI } from "../src/apis/health/api"
import Avalanche from "src"

describe("Info", (): void => {
  const avalanche: Avalanche = getAvalanche()
  var health: HealthAPI

  beforeAll(() => {
    return new Promise((resolve) => {
      avalanche.fetchNetworkSettings().then((value) => {
        health = avalanche.Health()
        resolve(value)
      })
    })
  })

  // test_name          response_promise               resp_fn                 matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "healthResponse",
      () => health.health(),
      (x) => {
        return x.healthy
      },
      Matcher.toBe,
      () => true
    ]
  ]

  createTests(tests_spec)
})
