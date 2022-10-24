import { Buffer } from "buffer/"
import { SubnetAuth } from "src/apis/platformvm"
import BinTools from "src/utils/bintools"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("SubnetAuth", (): void => {
  const subnetAuth1: SubnetAuth = new SubnetAuth()
  const subnetAuth2: SubnetAuth = new SubnetAuth()

  test("getters", (): void => {
    const typeName: string = subnetAuth1.getTypeName()
    expect(typeName).toBe("SubnetAuth")

    const typeID: number = subnetAuth1.getTypeID()
    expect(typeID).toBe(10)

    let addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(0, 0, 4)
    subnetAuth1.addAddressIndex(addressIndex)
    addressIndex = Buffer.alloc(4)
    addressIndex.writeUIntBE(1, 0, 4)
    subnetAuth1.addAddressIndex(addressIndex)

    const numAddressIndices: number = subnetAuth1.getNumAddressIndices()
    expect(numAddressIndices).toBe(2)

    const addressIndices: Buffer[] = subnetAuth1.getAddressIndices()
    expect(Buffer.isBuffer(addressIndices[0])).toBeTruthy()
    expect(bintools.fromBufferToBN(addressIndices[0]).toNumber()).toBe(0)
    expect(bintools.fromBufferToBN(addressIndices[1]).toNumber()).toBe(1)
  })

  test("toBuffer", (): void => {
    const subnetAuth1Buf: Buffer = subnetAuth1.toBuffer()
    subnetAuth2.fromBuffer(subnetAuth1Buf)
    const subnetAuth1Hex: string = subnetAuth1.toBuffer().toString("hex")
    const subnetAuth2Hex: string = subnetAuth2.toBuffer().toString("hex")
    expect(subnetAuth1Hex).toBe(subnetAuth2Hex)
  })
})
