import { Buffer } from "buffer/"
import { PlatformVMConstants } from "src/apis/platformvm"
import { AddVoteTx } from "src/apis/platformvm/addvotetx"
import { BinTools } from "../../../src"
import { Serialization } from "../../../src/utils"

describe("AddProposalTx", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addVoteTxHex: string =
    "000003ea0000000000000000000000000000000000000000000000000000000000000000000000015e21ded8a9e53a62f6c48ef045b37c938c5c5e9b25a14b4987db93682ca30f7600000007000000e8d495cdc0000000000000000000000001000000014ac77d43e4526f5b1c62ab9c1d3e52ab52d5a1460000000169f5f810578f25fb63926f30730c6d52a3c43f246978ffd8e3d9caf183c04114000000115e21ded8a9e53a62f6c48ef045b37c938c5c5e9b25a14b4987db93682ca30f7600000005000000e8d4a5100000000001000000000000000065217cca3a0a14a3adbad251c4e8fb4eed9adacc26a516f04a5d094cd6e6bd050000000a000000002015000000004ac77d43e4526f5b1c62ab9c1d3e52ab52d5a1460000000a0000000100000000000000020000000900000001140f8e83d60a43ac2182dfb4c5d0244a5e88d42987d498557c923421b83a7ac76dee3a54089e5bc2314815cbed0ff7526d309e3f75b19287641b8b838a71128c010000000900000001140f8e83d60a43ac2182dfb4c5d0244a5e88d42987d498557c923421b83a7ac76dee3a54089e5bc2314815cbed0ff7526d309e3f75b19287641b8b838a71128c01f14a79c3"
  const addVoteTxBuf: Buffer = Buffer.from(addVoteTxHex, "hex")
  const addVoteTx: AddVoteTx = new AddVoteTx()
  addVoteTx.fromBuffer(addVoteTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const addVoteTxTypeName: string = addVoteTx.getTypeName()
    expect(addVoteTxTypeName).toBe("AddVoteTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addVoteTxTypeID: number = addVoteTx.getTypeID()
    expect(addVoteTxTypeID).toBe(PlatformVMConstants.ADDVOTETX)
  })

  test("getProposalID", async (): Promise<void> => {
    const proposalID: Buffer = addVoteTx.getProposalID()
    const expected = "mYFYkuzAV6tdGPHMUReNAnTPU5u8yC5ogR4PpYQPPxAa52BmT"
    expect(bintools.cb58Encode(proposalID)).toBe(expected)
  })

  test("getVoterAddress", async (): Promise<void> => {
    const address: Buffer = addVoteTx.getVoterAddress()
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus1ftrh6sly2fh4k8rz4wwp60jj4dfdtg2xv3unrj"
    )
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addVoteTx.toBuffer()
    const asvTx: AddVoteTx = new AddVoteTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddressStateTx: object = addVoteTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDVOTETX,
      _typeName: "AddVoteTx",
      networkID: serialization.encoder(
        networkIDBuff,
        "hex",
        "Buffer",
        "decimalString"
      ),
      blockchainID: serialization.encoder(
        Buffer.alloc(32, 0),
        "hex",
        "Buffer",
        "cb58"
      ),
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.from("")), "cb58")
        .toString("hex"),
      ins: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableInput",
          assetID:
            "5e21ded8a9e53a62f6c48ef045b37c938c5c5e9b25a14b4987db93682ca30f76",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000000e8d4a51000",
            sigIdxs: [
              {
                _codecID: null,
                _typeID: null,
                _typeName: "SigIdx",
                bsize: "00000004",
                bytes: "00000000",
                source: "0000000000000000000000000000000000000000"
              }
            ]
          },
          outputidx: "00000011",
          txid: "69f5f810578f25fb63926f30730c6d52a3c43f246978ffd8e3d9caf183c04114"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "5e21ded8a9e53a62f6c48ef045b37c938c5c5e9b25a14b4987db93682ca30f76",
          output: {
            _codecID: null,
            _typeID: 7,
            _typeName: "SECPTransferOutput",
            addresses: [
              {
                _codecID: null,
                _typeID: null,
                _typeName: "Address",
                bsize: "00000014",
                bytes: "4ac77d43e4526f5b1c62ab9c1d3e52ab52d5a146"
              }
            ],
            amount: "000000e8d495cdc0",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      votePayload: {
        vote: {
          optionIndex: "00000000"
        }
      },
      voterAddress: "4ac77d43e4526f5b1c62ab9c1d3e52ab52d5a146",
      voterAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddressStateTx).toStrictEqual(expectedJSON)
  })
})
