import { Buffer } from "buffer/"
import {
  RemoveSubnetValidatorTx,
  PlatformVMConstants,
  SubnetAuth
} from "src/apis/platformvm"
import { bufferToNodeIDString } from "src/utils"

describe("RemoveSubnetValidatorTx", (): void => {
  const removeSubnetValidatorTxHex: string =
    "0000053900000000000000000000000000000000000000000000000000000000000000000000000117cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f0000000700470de4a3c8b180000000000000000000000001000000023cb7d3842e8cee6a0ebd09f1fe884f6861e1b29ca43c1f6ecdcb1fcec86d78446b9cf619c64c604b000000018ced4aeb38582518eef8c67aad4df719d7f65f68c676e745a56762e94db0dfeb0000000017cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f0000000500470de4a3d7f3c000000001000000000000009b4d616e75616c6c792063726561746520612072656d6f76655375626e657456616c696461746f7254782077686963682063726561746573206120312d6f662d322041564158207574786f20616e642072656d6f76657320612076616c696461746f722066726f6d2061207375626e657420627920636f72726563746c79207369676e696e672074686520322d6f662d33205375626e657441757468e9094f73698002fd52c90819b457b9fbc866ab8010ea2f81249b0a7fe756533a2191aef6377eeaeb192b4c1b42c406366dbff3dd0000000a000000020000000000000001"
  const removeSubnetValidatorTxBuf: Buffer = Buffer.from(
    removeSubnetValidatorTxHex,
    "hex"
  )
  const removeSubnetValidatorTx: RemoveSubnetValidatorTx = new RemoveSubnetValidatorTx()
  removeSubnetValidatorTx.fromBuffer(removeSubnetValidatorTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const removeSubnetValidatorTxTypeName: string =
      removeSubnetValidatorTx.getTypeName()
    expect(removeSubnetValidatorTxTypeName).toBe("RemoveSubnetValidatorTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const removeSubnetValidatorTxTypeID: number = removeSubnetValidatorTx.getTypeID()
    expect(removeSubnetValidatorTxTypeID).toBe(
      PlatformVMConstants.REMOVESUBNETVALIDATORTX
    )
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = removeSubnetValidatorTx.toBuffer()
    const rsvTx: RemoveSubnetValidatorTx = new RemoveSubnetValidatorTx()
    rsvTx.fromBuffer(buf)
    const buf2: Buffer = rsvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("getNodeID", async (): Promise<void> => {
    const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
    const nodeIDBuf: Buffer = removeSubnetValidatorTx.getNodeID()
    const nID: string = bufferToNodeIDString(nodeIDBuf)
    expect(nID).toBe(nodeID)
  })

  test("getSubnetID", async (): Promise<void> => {
    const subnetID: string = "8T4oUrP7kXzetGF2bYWF21oJHUT18rJCjfBt3J299hA1Smcqa"
    const sID: string = removeSubnetValidatorTx.getSubnetID()
    expect(subnetID).toBe(sID)
  })

  describe("SubnetAuth", (): void => {
    const sa: SubnetAuth = removeSubnetValidatorTx.getSubnetAuth()

    test("getTypeName", async (): Promise<void> => {
      const subnetAuthTypeName: string = sa.getTypeName()
      expect(subnetAuthTypeName).toBe("SubnetAuth")
    })

    test("getTypeID", async (): Promise<void> => {
      const subnetAuthTypeID: number = sa.getTypeID()
      expect(subnetAuthTypeID).toBe(PlatformVMConstants.SUBNETAUTH)
    })

    test("getNumAddressIndices", async (): Promise<void> => {
      const numAddressIndices: number = sa.getNumAddressIndices()
      const nAI: number = 2
      expect(numAddressIndices).toBe(nAI)
    })

    test("addressIndices", async (): Promise<void> => {
      const ai: number[] = [0, 1]
      const addressIndices: Buffer[] = sa.getAddressIndices()
      addressIndices.forEach((addressIndex: Buffer, index: number) => {
        expect(addressIndex.readInt32BE(0)).toBe(ai[index])
      })
    })
  })
})
