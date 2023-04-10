import BN from "bn.js"
import { Buffer } from "buffer/"
import { PlatformVMConstants } from "src/apis/platformvm"
import {
  ADDRESSSTATEKYCVERIFIED,
  AddressStateTx
} from "src/apis/platformvm/addressstatetx"
import BinTools from "src/utils/bintools"
import { DefaultNetworkID, Serialization } from "src/utils"

const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()

describe("AddressStateTx", (): void => {
  const addressStateTxHex: string =
    "0000000110101010101010101010101010101010101010101010101010101010101010100000000000000000000000046d656d6f28ed371fef40e69e4e43138df31278d087fe46242001"
  const addressStateTxBuf: Buffer = Buffer.from(addressStateTxHex, "hex")
  const addressStateTx: AddressStateTx = new AddressStateTx()
  addressStateTx.fromBuffer(addressStateTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const addressStateTxTypeName: string = addressStateTx.getTypeName()
    expect(addressStateTxTypeName).toBe("AddressStateTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addressStateTxTypeID: number = addressStateTx.getTypeID()
    expect(addressStateTxTypeID).toBe(PlatformVMConstants.ADDRESSSTATETX)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addressStateTx.toBuffer()
    const asvTx: AddressStateTx = new AddressStateTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddressStateTx: object = addressStateTx.serialize()

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDRESSSTATETX,
      _typeName: "AddressStateTx",
      address: serialization
        .typeToBuffer(
          "X-local19rknw8l0grnfunjrzwxlxync6zrlu33ynpm3qq",
          "bech32"
        )
        .toString("hex"),
      blockchainID: serialization.encoder(
        Buffer.alloc(32, 16),
        "hex",
        "Buffer",
        "cb58"
      ),
      ins: [],
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.from("memo")), "cb58")
        .toString("hex"),
      networkID: String(DefaultNetworkID).padStart(8, "0"),
      outs: [],
      state: ADDRESSSTATEKYCVERIFIED,
      remove: true
    }
    expect(serializedAddressStateTx).toStrictEqual(expectedJSON)
  })

  test("getAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "X-local19rknw8l0grnfunjrzwxlxync6zrlu33ynpm3qq",
      "local"
    )
    const address: Buffer = addressStateTx.getAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getState", async (): Promise<void> => {
    const expectedState = ADDRESSSTATEKYCVERIFIED
    expect(addressStateTx.getState()).toBe(expectedState)
  })

  test("getRemove", async (): Promise<void> => {
    const expectedRemove = true
    expect(addressStateTx.getRemove()).toBe(expectedRemove)
  })
})
