import { UTXOSet, UTXO } from "../../../src/apis/avm/utxos"
import { KeyChain } from "../../../src/apis/avm/keychain"
import {
  SECPTransferInput,
  TransferableInput
} from "../../../src/apis/avm/inputs"
import createHash from "create-hash"
import BinTools from "../../../src/utils/bintools"
import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  SECPTransferOutput,
  AmountOutput,
  TransferableOutput
} from "../../../src/apis/avm/outputs"
import { EVMConstants } from "../../../src/apis/evm/constants"
import { Input } from "../../../src/common/input"
import { Output } from "../../../src/common/output"
import { EVMInput } from "../../../src/apis/evm"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
describe("Inputs", (): void => {
  let set: UTXOSet
  let keymgr1: KeyChain
  let keymgr2: KeyChain
  let addrs1: Buffer[]
  let addrs2: Buffer[]
  let utxos: UTXO[]
  let hrp: string = "tests"
  const amnt: number = 10000
  beforeEach((): void => {
    set = new UTXOSet()
    keymgr1 = new KeyChain(hrp, "C")
    keymgr2 = new KeyChain(hrp, "C")
    addrs1 = []
    addrs2 = []
    utxos = []
    for (let i: number = 0; i < 3; i++) {
      addrs1.push(keymgr1.makeKey().getAddress())
      addrs2.push(keymgr2.makeKey().getAddress())
    }
    const amount: BN = new BN(amnt)
    const addresses: Buffer[] = keymgr1.getAddresses()
    const locktime: BN = new BN(54321)
    const threshold: number = 3

    for (let i: number = 0; i < 3; i++) {
      const txid: Buffer = Buffer.from(
        createHash("sha256")
          .update(bintools.fromBNToBuffer(new BN(i), 32))
          .digest()
      )
      const txidx: Buffer = Buffer.from(bintools.fromBNToBuffer(new BN(i), 4))
      const assetID: Buffer = Buffer.from(
        createHash("sha256").update(txid).digest()
      )
      const out: Output = new SECPTransferOutput(
        amount.add(new BN(i)),
        addresses,
        locktime,
        threshold
      )
      const xferout: TransferableOutput = new TransferableOutput(assetID, out)
      const u: UTXO = new UTXO(
        EVMConstants.LATESTCODEC,
        txid,
        txidx,
        assetID,
        out
      )
      u.fromBuffer(
        Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()])
      )
      utxos.push(u)
    }
    set.addArray(utxos)
  })
  test("SECPInput", (): void => {
    let u: UTXO
    let txid: Buffer
    let txidx: Buffer
    const amount: BN = new BN(amnt)
    let input: SECPTransferInput
    let xferinput: TransferableInput

    u = utxos[0]
    txid = u.getTxID()
    txidx = u.getOutputIdx()
    const asset = u.getAssetID()

    input = new SECPTransferInput(amount)
    xferinput = new TransferableInput(txid, txidx, asset, input)
    expect(xferinput.getUTXOID()).toBe(u.getUTXOID())
    expect(input.getInputID()).toBe(EVMConstants.SECPINPUTID)

    input.addSignatureIdx(0, addrs2[0])
    input.addSignatureIdx(1, addrs2[1])

    const newin: SECPTransferInput = new SECPTransferInput()
    newin.fromBuffer(bintools.b58ToBuffer(input.toString()))
    expect(newin.toBuffer().toString("hex")).toBe(
      input.toBuffer().toString("hex")
    )
    expect(newin.getSigIdxs().toString()).toBe(input.getSigIdxs().toString())
  })

  test("Input comparator", (): void => {
    const inpt1: SECPTransferInput = new SECPTransferInput(
      (utxos[0].getOutput() as AmountOutput).getAmount()
    )

    const inpt2: SECPTransferInput = new SECPTransferInput(
      (utxos[1].getOutput() as AmountOutput).getAmount()
    )

    const inpt3: SECPTransferInput = new SECPTransferInput(
      (utxos[2].getOutput() as AmountOutput).getAmount()
    )

    const cmp = Input.comparator()
    expect(cmp(inpt1, inpt2)).toBe(-1)
    expect(cmp(inpt1, inpt3)).toBe(-1)
    expect(cmp(inpt1, inpt1)).toBe(0)
    expect(cmp(inpt2, inpt2)).toBe(0)
    expect(cmp(inpt3, inpt3)).toBe(0)
  })

  test("TransferableInput comparator", (): void => {
    const inpt1: SECPTransferInput = new SECPTransferInput(
      (utxos[0].getOutput() as AmountOutput).getAmount()
    )
    const in1: TransferableInput = new TransferableInput(
      utxos[0].getTxID(),
      utxos[0].getOutputIdx(),
      utxos[0].getAssetID(),
      inpt1
    )

    const inpt2: SECPTransferInput = new SECPTransferInput(
      (utxos[1].getOutput() as AmountOutput).getAmount()
    )
    const in2: TransferableInput = new TransferableInput(
      utxos[1].getTxID(),
      utxos[1].getOutputIdx(),
      utxos[1].getAssetID(),
      inpt2
    )

    const inpt3: SECPTransferInput = new SECPTransferInput(
      (utxos[2].getOutput() as AmountOutput).getAmount()
    )
    const in3: TransferableInput = new TransferableInput(
      utxos[2].getTxID(),
      utxos[2].getOutputIdx(),
      utxos[2].getAssetID(),
      inpt3
    )

    const cmp = TransferableInput.comparator()
    expect(cmp(in1, in2)).toBe(-1)
    expect(cmp(in1, in3)).toBe(-1)
    expect(cmp(in1, in1)).toBe(0)
    expect(cmp(in2, in2)).toBe(0)
    expect(cmp(in3, in3)).toBe(0)
  })

  test("EVMInput comparator", (): void => {
    let inputs: EVMInput[] = []
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
    const nonce1: number = 0
    const nonce2: number = 1
    const nonce3: number = 2
    const nonce4: number = 3
    const nonce5: number = 4
    const nonce6: number = 5
    const nonce7: number = 6
    const nonce8: number = 7

    const input1: EVMInput = new EVMInput(address1, amount1, assetID1, nonce1)
    inputs.push(input1)
    const input2: EVMInput = new EVMInput(address1, amount2, assetID2, nonce2)
    inputs.push(input2)
    const input3: EVMInput = new EVMInput(address3, amount3, assetID2, nonce3)
    inputs.push(input3)
    const input4: EVMInput = new EVMInput(address4, amount4, assetID3, nonce4)
    inputs.push(input4)
    const input5: EVMInput = new EVMInput(address1, amount5, assetID5, nonce5)
    inputs.push(input5)
    const input6: EVMInput = new EVMInput(address6, amount6, assetID6, nonce6)
    inputs.push(input6)
    const input7: EVMInput = new EVMInput(address1, amount7, assetID7, nonce7)
    inputs.push(input7)
    const input8: EVMInput = new EVMInput(address8, amount8, assetID8, nonce8)
    inputs.push(input8)
    inputs = inputs.sort(EVMInput.comparator())
    expect(inputs[0].getAmount().toString()).toBe("8")
    expect(inputs[1].getAmount().toString()).toBe("6")
    expect(inputs[2].getAmount().toString()).toBe("4")
    expect(inputs[3].getAmount().toString()).toBe("7")
    expect(inputs[4].getAmount().toString()).toBe("2")
    expect(inputs[5].getAmount().toString()).toBe("5")
    expect(inputs[6].getAmount().toString()).toBe("1")
    expect(inputs[7].getAmount().toString()).toBe("3")

    const cmp = EVMInput.comparator()
    expect(cmp(input2, input1)).toBe(-1)
    expect(cmp(input1, input3)).toBe(-1)
    expect(cmp(input2, input3)).toBe(-1)
    expect(cmp(input1, input1)).toBe(0)
    expect(cmp(input2, input2)).toBe(0)
    expect(cmp(input3, input3)).toBe(0)
    expect(cmp(input1, input2)).toBe(1)
    expect(cmp(input3, input1)).toBe(1)
    expect(cmp(input3, input2)).toBe(1)
  })
})
