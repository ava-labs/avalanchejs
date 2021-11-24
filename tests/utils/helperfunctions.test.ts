import { ImportTx } from "src/apis/evm"
import { calcBytesCost } from "src/utils"

describe("HelperFunctions", (): void => {
  test("calcBytesCost", (): void => {
    const importTx: ImportTx = new ImportTx()
    // an empty EVM ImportTx is 76 bytes
    const size: number = 76
    const cost: number = calcBytesCost(importTx.toBuffer().byteLength)
    expect(cost).toEqual(size)
  })
})
