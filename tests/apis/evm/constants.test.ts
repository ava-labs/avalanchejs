import { BN } from "src"
import { Defaults } from "../../../src/utils/constants"
import { Networks, Network } from "../../../src/apis/evm/constants"

describe("EVMConstants", (): void => {
  describe("compare min and max gas prices", (): void => {
    const networks: Networks = Defaults.network
    const min: number = 25000000000
    const max: number = 1000000000000
    const networkIDs: number[] = [1, 5, 12345]
    networkIDs.forEach((networkID: number): void => {
      test(`NetworkID: ${networkID}`, async (): Promise<void> => {
        const localNetwork: Network = networks[networkID]
        const minGasPriceBN: BN = localNetwork.C.minGasPrice
        const maxGasPriceBN: BN = localNetwork.C.maxGasPrice
        const minGasPriceNum: number = new BN(minGasPriceBN).toNumber()
        const maxGasPriceNum: number = new BN(maxGasPriceBN).toNumber()
        expect(minGasPriceNum).toBeLessThanOrEqual(maxGasPriceNum)
        expect(minGasPriceNum).toEqual(min)
        expect(maxGasPriceNum).toBeGreaterThanOrEqual(minGasPriceNum)
        expect(maxGasPriceNum).toEqual(max)
      })
    })
  })
})
