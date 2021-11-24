import { ImportTx } from "src/apis/evm"
import { calcBytesCost } from "src/utils"

describe("HelperFunctions", (): void => {
  test("calcBytesCost", (): void => {
    const importTx: ImportTx = new ImportTx()
    // an empty EVM ImportTx is 76 bytes
    let cost: number = 76
    let bytesCost: number = calcBytesCost(importTx.toBuffer().byteLength)
    expect(bytesCost).toEqual(cost)

    // the byteCost should always be 1 nAVAX per byte
    let size: number = 100
    cost = 100
    bytesCost = calcBytesCost(size)
    expect(bytesCost).toEqual(cost)

    size = 507
    cost = 507
    bytesCost = calcBytesCost(size)
    expect(bytesCost).toEqual(cost)
  })
})
