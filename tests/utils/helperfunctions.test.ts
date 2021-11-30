import { ExportTx, ImportTx, UnsignedTx } from "src/apis/evm"
import { calcBytesCost, costExportTx, costImportTx } from "src/utils"
import { Buffer } from "buffer/"

describe("HelperFunctions", (): void => {
  test("calcBytesCost", (): void => {
    const importTx: ImportTx = new ImportTx()
    // an empty EVM ImportTx is 76 bytes
    let cost: number = 76
    let bytesCost: number = calcBytesCost(importTx.toBuffer().byteLength)
    expect(cost).toEqual(bytesCost)

    // the byteCost should always be 1 unit of gas per byte
    let size: number = 100
    cost = 100
    bytesCost = calcBytesCost(size)
    expect(cost).toEqual(bytesCost)

    size = 507
    cost = 507
    bytesCost = calcBytesCost(size)
    expect(cost).toEqual(bytesCost)

    let hex: string =
      "000030399d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19d891ad56056d9c01f18f43f58b5c784ad07a4a49cf3d1f11623804b5cba2c6bf000000018db97c7cece249c2b98bdc0226cc4c2a57bf52fc00b1a2bc2ec50000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000700b1a2bc2eb5bdc0000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c"
    const exportTx: ExportTx = new ExportTx()
    let unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
    exportTx.fromBuffer(new Buffer(hex, "hex"))
    cost = costExportTx(unsignedTx)
    bytesCost = 11230
    expect(cost).toEqual(bytesCost)

    hex =
      "000030399d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b19d891ad56056d9c01f18f43f58b5c784ad07a4a49cf3d1f11623804b5cba2c6bf0000000000000000"
    importTx.fromBuffer(new Buffer(hex, "hex"))
    unsignedTx = new UnsignedTx(importTx)
    cost = costImportTx(unsignedTx)
    bytesCost = 10082
    expect(cost).toEqual(bytesCost)
  })
})
