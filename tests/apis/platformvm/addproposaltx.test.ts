import { Buffer } from "buffer/"
import { PlatformVMConstants } from "src/apis/platformvm"
import { AddProposalTx } from "src/apis/platformvm/addproposaltx"
import { BinTools } from "../../../src"
import { AdminProposal, UnsignedTx } from "../../../src/apis/platformvm"
import { Serialization } from "../../../src/utils"

describe("AddBaseFeeProposalTx", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000007000002b55c7c83000000000000000000000000010000000146a9c04f4bf783aa69daabd519dcf36978168b66000000014c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f0000000059eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000005000002b55c8bc5400000000100000000000000000000001b3c703e70726f706f73616c206465736372697074696f6e3c2f703e000000220000000020130000000100000000000f424000000000665f9c7000000000666a286f46a9c04f4bf783aa69daabd519dcf36978168b660000000a00000001000000000000000200000009000000016b6a92bcffea16d1fb84188d94be4dee07cbda67841278b4afd869101833cdee3f7c6720639ac51ff73f3adeba8c64316168e1a170c27b030c3606026162e73a0100000009000000016b6a92bcffea16d1fb84188d94be4dee07cbda67841278b4afd869101833cdee3f7c6720639ac51ff73f3adeba8c64316168e1a170c27b030c3606026162e73a01afd79f9e"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx
  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-local1g65uqn6t77p656w64023nh8nd9updzmxyymev2"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.BASEFEEPORPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const proposal = payload.getProposal()
    expect(proposal.getTypeID()).toBe(proposalTypeID)
  })

  test("getProposalDescription", async (): Promise<void> => {
    const description = addProposalTx.getProposalDescription()
    const proposalDescription = new Buffer("<p>proposal description</p>")

    expect(description.toString()).toStrictEqual(proposalDescription.toString())
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _typeName: "AddProposalTx",
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
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000002b55c8bc540",
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
          outputidx: "00000000",
          txid: "4c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "46a9c04f4bf783aa69daabd519dcf36978168b66"
              }
            ],
            amount: "000002b55c7c8300",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      proposalDescription: serialization.encoder(
        Buffer.from("<p>proposal description</p>"),
        "hex",
        "Buffer",
        "cb58"
      ),
      proposalPayload: {
        proposal: {
          end: "00000000666a286f",
          options: [
            {
              _codecID: null,
              _typeID: null,
              _typeName: "VoteOption",
              bsize: "00000008",
              bytes: "00000000000f4240"
            }
          ],
          start: "00000000665f9c70"
        }
      },
      proposerAddress: "46a9c04f4bf783aa69daabd519dcf36978168b66",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddProposalTx).toStrictEqual(expectedJSON)
  })
})

describe("AddMemberProposalTx", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000007000002b55c7c83000000000000000000000000010000000146a9c04f4bf783aa69daabd519dcf36978168b66000000014c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f0000000059eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000005000002b55c8bc5400000000100000000000000000000001b3c703e70726f706f73616c206465736372697074696f6e3c2f703e0000002a00000000201659f116d65aceba6d22cc557e8f3ee17e22c7757d00000000665f9c700000000066aeb67046a9c04f4bf783aa69daabd519dcf36978168b660000000a00000001000000000000000200000009000000016f181711aa627ada6b026b0a5e10275a92b3985f5ef8d9db20faf659cc96f3e07b6cee8a9d2aab012c9244e8a642fdc2b4e8b685af059e312964892f8421a8700100000009000000016f181711aa627ada6b026b0a5e10275a92b3985f5ef8d9db20faf659cc96f3e07b6cee8a9d2aab012c9244e8a642fdc2b4e8b685af059e312964892f8421a87001115acab2"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx

  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.ADDMEMBERPORPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const proposal = payload.getProposal()
    expect(proposal.getTypeID()).toBe(proposalTypeID)
  })

  test("getProposalDescription", async (): Promise<void> => {
    const proposalDescription = "<p>proposal description</p>"
    const description = addProposalTx.getProposalDescription().toString()
    expect(description).toBe(proposalDescription)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const addMemberProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _typeName: "AddProposalTx",
      _codecID: null,
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
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000002b55c8bc540",
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
          outputidx: "00000000",
          txid: "4c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "46a9c04f4bf783aa69daabd519dcf36978168b66"
              }
            ],
            amount: "000002b55c7c8300",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      proposalDescription: serialization.encoder(
        Buffer.from("<p>proposal description</p>"),
        "hex",
        "Buffer",
        "cb58"
      ),
      proposalPayload: {
        proposal: {
          applicantAddress: "59f116d65aceba6d22cc557e8f3ee17e22c7757d",
          end: "0000000066aeb670",
          start: "00000000665f9c70"
        }
      },
      proposerAddress: "46a9c04f4bf783aa69daabd519dcf36978168b66",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(addMemberProposalTx).toStrictEqual(expectedJSON)
  })
})

describe("ExcludeMemberProposalTx", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000007000002b55c7c83000000000000000000000000010000000146a9c04f4bf783aa69daabd519dcf36978168b66000000014c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f0000000059eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000005000002b55c8bc5400000000100000000000000000000001b3c703e70726f706f73616c206465736372697074696f6e3c2f703e0000002a000000002018bb2cb7881c10341abc7938402971d9f68861da5400000000665f9c70000000006668d6f046a9c04f4bf783aa69daabd519dcf36978168b660000000a00000001000000000000000200000009000000015167a52921ad81892a32cf12570aa60e4bd480fb051ec13f7dac515daf66d55e682c09afb94eb0a05b5c66c667df6992c98aa2845c01ae16084a2b31d58cb3640000000009000000015167a52921ad81892a32cf12570aa60e4bd480fb051ec13f7dac515daf66d55e682c09afb94eb0a05b5c66c667df6992c98aa2845c01ae16084a2b31d58cb36400e10737ff"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx

  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.EXCLUDEMEMBERPORPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const proposal = payload.getProposal()
    expect(proposal.getTypeID()).toBe(proposalTypeID)
  })

  test("getProposalDescription", async (): Promise<void> => {
    const proposalDescription = "<p>proposal description</p>"
    const description = addProposalTx.getProposalDescription().toString()
    expect(description).toBe(proposalDescription)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _typeName: "AddProposalTx",
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
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000002b55c8bc540",
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
          outputidx: "00000000",
          txid: "4c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "46a9c04f4bf783aa69daabd519dcf36978168b66"
              }
            ],
            amount: "000002b55c7c8300",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      proposalDescription: serialization.encoder(
        Buffer.from("<p>proposal description</p>"),
        "hex",
        "Buffer",
        "cb58"
      ),
      proposalPayload: {
        proposal: {
          memberAddress: "bb2cb7881c10341abc7938402971d9f68861da54",
          end: "000000006668d6f0",
          start: "00000000665f9c70"
        }
      },
      proposerAddress: "46a9c04f4bf783aa69daabd519dcf36978168b66",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddProposalTx).toStrictEqual(expectedJSON)
  })
})

describe("AddMemberAdminProposal", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000007000002b55c7c83000000000000000000000000010000000146a9c04f4bf783aa69daabd519dcf36978168b66000000014c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f0000000059eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000005000002b55c8bc5400000000100000000000000000000001b3c703e70726f706f73616c206465736372697074696f6e3c2f703e00000032000000002017000000000000201659f116d65aceba6d22cc557e8f3ee17e22c7757d00000000665f45940000000066ae5f9446a9c04f4bf783aa69daabd519dcf36978168b660000000a000000010000000000000002000000090000000175d14e821f5e45811308e12de7048404b12df9010df6825aed109e5809c5fcb437e4e0ae81e724493180506461d6e413eeb54515673b02dbd6d2fddeece1632000000000090000000175d14e821f5e45811308e12de7048404b12df9010df6825aed109e5809c5fcb437e4e0ae81e724493180506461d6e413eeb54515673b02dbd6d2fddeece1632000cd549b7c"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx

  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.ADMINPROPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const adminProposal = payload.getProposal()
    expect(adminProposal.getTypeID()).toBe(proposalTypeID)
    const execProposalTypeID = PlatformVMConstants.ADDMEMBERPORPOSAL_TYPE_ID
    const execProposal = (adminProposal as AdminProposal).getProposal()
    expect(execProposal.getTypeID()).toBe(execProposalTypeID)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _typeName: "AddProposalTx",
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
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000002b55c8bc540",
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
          outputidx: "00000000",
          txid: "4c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "46a9c04f4bf783aa69daabd519dcf36978168b66"
              }
            ],
            amount: "000002b55c7c8300",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      proposalDescription: serialization.encoder(
        Buffer.from("<p>proposal description</p>"),
        "hex",
        "Buffer",
        "cb58"
      ),
      proposalPayload: {
        proposal: {
          optionIndex: "00000000",
          proposal: {
            applicantAddress: "59f116d65aceba6d22cc557e8f3ee17e22c7757d",
            end: "0000000066ae5f94",
            start: "00000000665f4594"
          }
        }
      },
      proposerAddress: "46a9c04f4bf783aa69daabd519dcf36978168b66",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddProposalTx).toStrictEqual(expectedJSON)
  })
})

describe("ExcludeMemberAdminProposal", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000007000002b55c7c83000000000000000000000000010000000146a9c04f4bf783aa69daabd519dcf36978168b66000000014c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f0000000059eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a00000005000002b55c8bc5400000000100000000000000000000001b3c703e70726f706f73616c206465736372697074696f6e3c2f703e0000003200000000201700000000000020183cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000000665f475600000000666881d646a9c04f4bf783aa69daabd519dcf36978168b660000000a00000001000000000000000200000009000000012367c204d4421fbfd64e4b95d300cfdfaa5cf920b22b30242b263a836f9a0c1b7390b048f743b7fd0bf2cc49882523d8a5b7a22b4e7dbd85740483d23aa1a93c0100000009000000012367c204d4421fbfd64e4b95d300cfdfaa5cf920b22b30242b263a836f9a0c1b7390b048f743b7fd0bf2cc49882523d8a5b7a22b4e7dbd85740483d23aa1a93c01ba600e6e"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx

  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.ADMINPROPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const adminProposal = payload.getProposal()
    expect(adminProposal.getTypeID()).toBe(proposalTypeID)
    const execProposalTypeID = PlatformVMConstants.EXCLUDEMEMBERPORPOSAL_TYPE_ID
    const execProposal = (adminProposal as AdminProposal).getProposal()
    expect(execProposal.getTypeID()).toBe(execProposalTypeID)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _typeName: "AddProposalTx",
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
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "000002b55c8bc540",
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
          outputidx: "00000000",
          txid: "4c8fabc9807bdfb520f713ea3ea915e4b1201addfcfaef6925705522e92a3e3f"
        }
      ],
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "46a9c04f4bf783aa69daabd519dcf36978168b66"
              }
            ],
            amount: "000002b55c7c8300",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      proposalDescription: serialization.encoder(
        Buffer.from("<p>proposal description</p>"),
        "hex",
        "Buffer",
        "cb58"
      ),
      proposalPayload: {
        proposal: {
          optionIndex: "00000000",
          proposal: {
            memberAddress: "3cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c",
            end: "00000000666881d6",
            start: "00000000665f4756"
          }
        }
      },
      proposerAddress: "46a9c04f4bf783aa69daabd519dcf36978168b66",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddProposalTx).toStrictEqual(expectedJSON)
  })
})

describe("GeneralProposal", (): void => {
  const bintools = BinTools.getInstance()
  const serialization = Serialization.getInstance()
  const addProposalTxHex: string =
    "000000002010000003ea00000000000000000000000000000000000000000000000000000000000000000000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a0000000700016bcc41d9bdc0000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c000000010903208c79e9d29ad5e5ea7caf771ecca4db7a218c44d7c3619deea62e6227640000000159eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a0000000500016bcc41e9000000000001000000000000001400000000000000000000000000000000000000000000000b68656c6c6f20776f726c6400000331000000002019000000030000010054484953204f5054494f4e20434f4e54454e54204953203235362043484152414354455253204c4f4e4720787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878000000fa54484953204f5054494f4e20434f4e54454e54204953203235302043484152414354455253204c4f4e47207978787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878780000010054484953204f5054494f4e20434f4e54454e54204953203235362043484152414354455253204c4f4e47207a78787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878787878780000000066d1b693000000006720dea30005f37000000000000a604000000000003cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000a00000001000000000000000200000009000000011884e644385fa70dbd4e385e4ce1f0b5e84080308ffe57247c199684e590b4143d2f518f2b908d87b141a37d011cb409751138ddae40c6bac99ad496a5d1e06d0100000009000000011884e644385fa70dbd4e385e4ce1f0b5e84080308ffe57247c199684e590b4143d2f518f2b908d87b141a37d011cb409751138ddae40c6bac99ad496a5d1e06d019b2dc6f2"
  const unsignedTx = new UnsignedTx()
  unsignedTx.fromBuffer(Buffer.from(addProposalTxHex, "hex"))
  const addProposalTx = unsignedTx.getTransaction() as AddProposalTx

  test("getTypeName", async (): Promise<void> => {
    const addProposalTxTypeName: string = addProposalTx.getTypeName()
    expect(addProposalTxTypeName).toBe("AddProposalTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addProposalTxTypeID: number = addProposalTx.getTypeID()
    expect(addProposalTxTypeID).toBe(PlatformVMConstants.ADDPROPOSALTX)
  })

  test("getProposerAddress", async (): Promise<void> => {
    const expectedAddress: Buffer = bintools.stringToAddress(
      "P-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68"
    )
    const address: Buffer = addProposalTx.getProposerAddress()
    expect(address.toString()).toBe(expectedAddress.toString())
  })

  test("getProposalType", async (): Promise<void> => {
    const proposalTypeID = PlatformVMConstants.GENERALPROPOSAL_TYPE_ID
    const payload = addProposalTx.getProposalPayload()
    expect(payload.getProposalType()).toBe(proposalTypeID)
    const proposal = payload.getProposal()
    expect(proposal.getTypeID()).toBe(proposalTypeID)
  })

  test("getProposalDescription", async (): Promise<void> => {
    const description = addProposalTx.getProposalDescription()
    const proposalDescription = new Buffer("hello world")
    expect(description).toStrictEqual(proposalDescription)
  })

  test("getAllowEarlyFinish", async (): Promise<void> => {
    const payload = addProposalTx.getProposalPayload()
    const proposal = payload.getProposal()
  })

  test("serialize", async (): Promise<void> => {
    const serializedAddProposalTx: object = addProposalTx.serialize()
    const networkIDBuff = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(1002, 0)

    const expectedJSON = {
      _typeName: "AddProposalTx",
      _typeID: PlatformVMConstants.ADDPROPOSALTX,
      _codecID: null,
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
      outs: [
        {
          _codecID: null,
          _typeID: null,
          _typeName: "TransferableOutput",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a",
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
                bytes: "3cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c"
              }
            ],
            amount: "00016bcc41d9bdc0",
            locktime: "0000000000000000",
            threshold: "00000001"
          }
        }
      ],
      ins: [
        {
          _typeName: "TransferableInput",
          _typeID: null,
          _codecID: null,
          input: {
            _codecID: null,
            _typeID: 5,
            _typeName: "SECPTransferInput",
            amount: "00016bcc41e90000",
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
          outputidx: "00000001",
          txid: "0903208c79e9d29ad5e5ea7caf771ecca4db7a218c44d7c3619deea62e622764",
          assetID:
            "59eb48b8b3a928ca9d6b90a0f3492ab47ebf06e9edc553cfb6bcd2d3f38e319a"
        }
      ],
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.alloc(20)), "cb58")
        .toString("hex"),
      proposalDescription: serialization.encoder(
        Buffer.from("hello world"),
        "hex",
        "Buffer",
        "hex"
      ),
      proposalPayload: {
        proposal: {
          end: "000000006720dea3",
          start: "0000000066d1b693",
          mostVotedThresholdNominator: "000a604000000000",
          totalVotedThresholdNominator: "0005f37000000000",
          allowEarlyFinish: false,
          options: [
            {
              option: serialization.encoder(
                Buffer.from(
                  "THIS OPTION CONTENT IS 256 CHARACTERS LONG xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                ),
                "hex",
                "Buffer",
                "hex"
              )
            },
            {
              option: serialization.encoder(
                Buffer.from(
                  "THIS OPTION CONTENT IS 250 CHARACTERS LONG yxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                ),
                "hex",
                "Buffer",
                "hex"
              )
            },
            {
              option: serialization.encoder(
                Buffer.from(
                  "THIS OPTION CONTENT IS 256 CHARACTERS LONG zxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                ),
                "hex",
                "Buffer",
                "hex"
              )
            }
          ]
        }
      },
      proposerAddress: "3cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c",
      proposerAuth: {
        _codecID: null,
        _typeID: 10,
        _typeName: "SubnetAuth"
      }
    }
    expect(serializedAddProposalTx).toStrictEqual(expectedJSON)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addProposalTx.toBuffer()
    const addProposalTransaction: AddProposalTx = new AddProposalTx()
    addProposalTransaction.fromBuffer(buf)
    const buf2: Buffer = addProposalTransaction.toBuffer()

    expect(buf.toString("hex")).toStrictEqual(buf2.toString("hex"))
  })
})
