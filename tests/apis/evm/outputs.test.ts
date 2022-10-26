import { EVMOutput } from "../../../src/apis/evm"

describe("Inputs", () => {
  test("EVMOutput comparator", () => {
    let outs: EVMOutput[] = []
    const address1: string = "0x55ee05dF718f1a5C1441e76190EB1a19eE2C9430"
    const address3: string = "0x9632a79656af553F58738B0FB750320158495942"
    const address4: string = "0x4Cf2eD3665F6bFA95cE6A11CFDb7A2EF5FC1C7E4"
    const address6: string = "0x3C7daE394BBf8e9EE1359ad14C1C47003bD06293"
    const address8: string = "0x0Fa8EA536Be85F32724D57A37758761B86416123"
    const amount1: number = 1
    const amount2: number = 2
    const amount3: number = 3
    const amount4: number = 4
    const amount5: number = 5
    const amount6: number = 6
    const amount7: number = 7
    const amount8: number = 8
    const assetID1: string =
      "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe" // dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db
    const assetID2: string = "vvKCjrpggyQ8FhJ2D5EAKPh8x8y4JK93JQiWRpTKpEouydRbG" // 7a6e1e3c9c66ed8f076180f89d01320795628dca633001ff437ac6ab58b455be
    const assetID3: string = "eRo1eb2Yxd87KuMYANBSha3n138wtqRhFz2xjftsXWnmpCxyh" // 54fbd087a8a9c739c2c7926d742ea7b937adbd512b9ff0fd51f460a763d1371a
    const assetID5: string =
      "2QqUTT3XTgR6HLbCLGtjN2uDHHqNRaBgtBGJ5KCqW7BUaH1P8X" // b9d16d7c7d2674c3c67c5c26d9d6e39a09a5991c588cdf60c4cca732b66fa749
    const assetID6: string = "ZWXaLcAy1YWS3Vvjcrt2KcVA4VxBsMFt8yNDZABJkgBvgpRti" // 49d0dc67846a20dfea79b7beeba84769efa4a0273575f65ca79f9dee1cd1250e
    const assetID7: string = "FHfS61NfF5XdZU62bcXp9yRfgrZeiQC7VNJWKcpdb9QMLHs4L" // 2070e77e34941439dc7bcf502dcf555c6ef0e3cc46bbac8a03b22e15c84a81f1
    const assetID8: string = "ZL6NeWgcnxR2zhhKDx7h9Kg2mZgScC5N4RG5FCDayWY7W3whZ" // 496849239bb1541e97fa8f89256965bf7e657f3bb530cad820dd41706c5e3836

    const output1: EVMOutput = new EVMOutput(address1, amount1, assetID1)
    outs.push(output1)
    const output2: EVMOutput = new EVMOutput(address1, amount2, assetID2)
    outs.push(output2)
    const output3: EVMOutput = new EVMOutput(address3, amount3, assetID2)
    outs.push(output3)
    const output4: EVMOutput = new EVMOutput(address4, amount4, assetID3)
    outs.push(output4)
    const output5: EVMOutput = new EVMOutput(address1, amount5, assetID5)
    outs.push(output5)
    const output6: EVMOutput = new EVMOutput(address6, amount6, assetID6)
    outs.push(output6)
    const output7: EVMOutput = new EVMOutput(address1, amount7, assetID7)
    outs.push(output7)
    const output8: EVMOutput = new EVMOutput(address8, amount8, assetID8)
    outs.push(output8)
    outs = outs.sort(EVMOutput.comparator())
    expect(outs[0].getAmount().toString()).toBe("8")
    expect(outs[1].getAmount().toString()).toBe("6")
    expect(outs[2].getAmount().toString()).toBe("4")
    expect(outs[3].getAmount().toString()).toBe("7")
    expect(outs[4].getAmount().toString()).toBe("2")
    expect(outs[5].getAmount().toString()).toBe("5")
    expect(outs[6].getAmount().toString()).toBe("1")
    expect(outs[7].getAmount().toString()).toBe("3")

    const cmp = EVMOutput.comparator()
    expect(cmp(output2, output1)).toBe(-1)
    expect(cmp(output1, output3)).toBe(-1)
    expect(cmp(output2, output3)).toBe(-1)
    expect(cmp(output1, output1)).toBe(0)
    expect(cmp(output2, output2)).toBe(0)
    expect(cmp(output3, output3)).toBe(0)
    expect(cmp(output1, output2)).toBe(1)
    expect(cmp(output3, output1)).toBe(1)
    expect(cmp(output3, output2)).toBe(1)
  })

  test("EVMOutput from buffer should return amount", () => {
    const address: string = "0x55ee05dF718f1a5C1441e76190EB1a19eE2C9430"
    const amount: number = 1
    const assetID: string = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
    const output: EVMOutput = new EVMOutput(address, amount, assetID)
    expect(output.getAmount().toString()).toBe("1")

    const outputBuffer = new EVMOutput()
    outputBuffer.fromBuffer(output.toBuffer())
    expect(outputBuffer.getAmount().toString()).toBe("1")
  })
})
