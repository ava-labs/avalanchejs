import { HDNode } from "src"
import { Buffer } from 'buffer/'

describe("HDNode", (): void => {
  const xPriv: string = "xprv9s21ZrQH143K4RH1nRkHwuVz3qGREBLobwUoUBowLDucQXm4do8jvz12agvjHrAwjJXtq9BZ87WBPUPScDBnjKvBKVQ5xbS7GQwJKW7vXLD"
  const childXPriv: string = "xprvA7X7udsZk3q9mNMcGnN8PKHv5eHm6JA3TRzW2HsWnrYHbccXh5YMnRLA83VCPKWQUFmKf9AfCXSmoFs7HJ8Yr1LK52wJDVk262vGFszM4nb"
  const xPub: string = "xpub661MyMwAqRbcFSdAk5S6UECmA6MFQWiRBfPU5AsVcmrKY5HoFKPNYrKEq7isvaZVfNxhkrv5oXxFpQc6AVEcVW5NxeamKD6LyLUDMntbnq7"
  const msg: string = "bb413645935a9bf1ecf0c3d30df2d573"

  test("derive", (): void => {
    const seed: string = 'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
    const hdnode: HDNode = new HDNode(seed)
    const child = hdnode.derive("m/9000'/2614666'/4849181'/4660'/2'/1/3")
    expect(child.privateExtendedKey).toBe(childXPriv)
  })

  test("fromMasterSeedBuffer", (): void => {
    const seed: string = 'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
    const hdnode: HDNode = new HDNode(Buffer.from(seed))
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromMasterSeedString", (): void => {
    const seed: string = 'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
    const hdnode: HDNode = new HDNode(seed)
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromXPriv", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    expect(hdnode.privateExtendedKey).toBe(xPriv)
  })

  test("fromXPub", (): void => {
    const hdnode: HDNode = new HDNode(xPub)
    expect(hdnode.publicExtendedKey).toBe(xPub)
  })

  test("sign", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    const sig: Buffer = hdnode.sign(Buffer.from(msg))
    expect(Buffer.isBuffer(sig)).toBeTruthy()
  })

  test("verify", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    const sig: Buffer = hdnode.sign(Buffer.from(msg))
    const verify: boolean = hdnode.verify(Buffer.from(msg), sig)
    expect(verify).toBeTruthy()
  })

  test("wipePrivateData", (): void => {
    const hdnode: HDNode = new HDNode(xPriv)
    hdnode.wipePrivateData()
    console.log(hdnode.privateKey === null)
  })
})
