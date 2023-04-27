import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  KeyChain,
  PlatformVMAPI,
  PlatformVMConstants,
  SECPTransferInput,
  SECPTransferOutput,
  TransferableInput,
  TransferableOutput
} from "src/apis/platformvm"
import { ClaimAmount, ClaimTx, ClaimType } from "src/apis/platformvm/claimtx"
import BinTools from "src/utils/bintools"
import {
  DefaultLocalGenesisPrivateKey,
  DefaultNetworkID,
  PrivateKeyPrefix,
  Serialization
} from "src/utils"
import createHash from "create-hash"
import { SigIdx, ZeroBN } from "src/common"
import Avalanche from "src/index"

const avalanche: Avalanche = new Avalanche(
  "127.0.0.1",
  9650,
  "https",
  12345,
  undefined,
  undefined
)
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
const ownerID: Buffer = Buffer.from(
  createHash("sha256")
    .update(bintools.fromBNToBuffer(new BN(2), 32))
    .digest()
)
const depositTxID: Buffer = Buffer.from(
  createHash("sha256")
    .update(bintools.fromBNToBuffer(new BN(1), 32))
    .digest()
)

let platformVM: PlatformVMAPI
let keychain: KeyChain
let avaxAssetID: Buffer
let secpTransferOutput: SECPTransferOutput
let secpTransferInput: SECPTransferInput
let claimTx: ClaimTx

const removeJsonProperty = (obj, property) => {
  let json = JSON.stringify(obj)
  const regex = new RegExp(`,?"${property}":".*?",?`, "gi")
  json = json.replace(regex, "")
  json = json.replace(/""/, '","')
  return JSON.parse(json)
}

beforeAll(() => {
  platformVM = new PlatformVMAPI(avalanche, "/ext/bc/P")
  keychain = platformVM.keyChain()
  keychain.importKey(privKey)

  avaxAssetID = bintools.cb58Decode(platformVM.getNetwork().X.avaxAssetID)
  secpTransferInput = new SECPTransferInput(new BN(1))
  secpTransferInput.addSignatureIdx(0, keychain.getAddresses()[0])

  secpTransferOutput = new SECPTransferOutput(
    new BN(1),
    [keychain.getAddresses()[0]],
    ZeroBN,
    1
  )

  claimTx = new ClaimTx(
    1,
    Buffer.from(
      "1010101010101010101010101010101010101010101010101010101010101010",
      "hex"
    ),
    [new TransferableOutput(avaxAssetID, secpTransferOutput)],
    [
      new TransferableInput(
        depositTxID,
        Buffer.from("00000000", "hex"),
        avaxAssetID,
        secpTransferInput
      )
    ],
    Buffer.from("memo"),
    [new ClaimAmount(ownerID, ClaimType.EXPIRED_DEPOSIT_REWARD, new BN(1))]
  )
})

describe("ClaimTx", (): void => {
  test("getTypeName", async (): Promise<void> => {
    const claimTxTypeName: string = claimTx.getTypeName()
    expect(claimTxTypeName).toBe("ClaimTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const claimTxTypeID: number = claimTx.getTypeID()
    expect(claimTxTypeID).toBe(PlatformVMConstants.CLAIMTX)
  })

  test("getClaimAmounts", async (): Promise<void> => {
    const claimAmounts: ClaimAmount[] = claimTx.getClaimAmounts()
    expect(claimAmounts).toStrictEqual([
      new ClaimAmount(ownerID, ClaimType.EXPIRED_DEPOSIT_REWARD, new BN(1))
    ])
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = claimTx.toBuffer()
    const asvTx: ClaimTx = new ClaimTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedClaimTx: object = claimTx.serialize()

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.CLAIMTX,
      _typeName: "ClaimTx",
      blockchainID: serialization.encoder(
        Buffer.alloc(32, 16),
        "hex",
        "Buffer",
        "cb58"
      ),
      outs: [
        new TransferableOutput(avaxAssetID, secpTransferOutput).serialize()
      ],
      ins: [
        new TransferableInput(
          depositTxID,
          Buffer.from(bintools.fromBNToBuffer(new BN(0), 4)),
          avaxAssetID,
          secpTransferInput
        ).serialize()
      ],
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.from("memo")), "cb58")
        .toString("hex"),
      networkID: String(DefaultNetworkID).padStart(8, "0"),
      claimAmounts: [
        {
          id: ownerID.toString("hex"),
          type: new BN(ClaimType.EXPIRED_DEPOSIT_REWARD).toString(10, 16),
          amount: new BN(1).toString(10, 16)
        }
      ]
    }

    expect(removeJsonProperty(serializedClaimTx, "source")).toStrictEqual(
      removeJsonProperty(expectedJSON, "source")
    )
  })

  test("addSignatureIdx", async (): Promise<void> => {
    claimTx.addSigIdxs([new SigIdx(0, keychain.getAddresses()[0])])
    const actualSigIdxs: SigIdx[][] = claimTx.getSigIdxs()
    expect(actualSigIdxs.length).toBe(1)
    expect(actualSigIdxs[0].length).toBe(1)
    expect(actualSigIdxs[0][0].getSource()).toStrictEqual(
      keychain.getAddresses()[0]
    )
  })
})
