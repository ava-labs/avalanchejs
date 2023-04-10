import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  KeyChain,
  ParseableOutput,
  PlatformVMAPI,
  PlatformVMConstants,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  TransferableInput,
  TransferableOutput
} from "src/apis/platformvm"
import { ClaimTx, ClaimType } from "src/apis/platformvm/claimtx"
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
const claimedAmount = new BN(1)
let rewardOutputOwners: SECPOwnerOutput
let platformVM: PlatformVMAPI
let keychain: KeyChain
let avaxAssetID: Buffer
let secpTransferOutput: SECPTransferOutput
let secpTransferInput: SECPTransferInput

const removeJsonProperty = (obj, property) => {
  let json = JSON.stringify(obj)
  const regex = new RegExp(`,?"${property}":".*?",?`, "gi")
  json = json.replace(regex, "")
  json = json.replace(/""/, '","')
  return JSON.parse(json)
}

beforeAll(async () => {
  platformVM = new PlatformVMAPI(avalanche, "/ext/bc/P")
  keychain = platformVM.keyChain()
  keychain.importKey(privKey)

  rewardOutputOwners = new SECPOwnerOutput(
    [keychain.getAddresses()[0]],
    ZeroBN,
    1
  )
  avaxAssetID = await platformVM.getAVAXAssetID()
  secpTransferInput = new SECPTransferInput(new BN(1))
  secpTransferInput.addSignatureIdx(0, keychain.getAddresses()[0])

  secpTransferOutput = new SECPTransferOutput(
    new BN(1),
    [keychain.getAddresses()[0]],
    ZeroBN,
    1
  )
})
describe("ClaimTx", (): void => {
  const claimTxHex: string =
    "00000001101010101010101010101010101010101010101010101010101010101010101000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070000000000000001000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001ec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc500000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500000000000000010000000100000000000000046d656d6f00000001ec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5000000019267d3dbed802941483f1afa2a6bc68de5f653128aca9bf1461c5d0a3ad36ed200000001000000000000000100000000000000020000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c"
  const claimTxBuf: Buffer = Buffer.from(claimTxHex, "hex")
  const claimTx: ClaimTx = new ClaimTx()
  claimTx.fromBuffer(claimTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const claimTxTypeName: string = claimTx.getTypeName()
    expect(claimTxTypeName).toBe("ClaimTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const claimTxTypeID: number = claimTx.getTypeID()
    expect(claimTxTypeID).toBe(PlatformVMConstants.CLAIMTX)
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
      claimableOwnerIDs: [ownerID.toString("hex")],
      claimedAmounts: [new BN(1).toString(10, 16)],
      depositTxs: [depositTxID.toString("hex")],
      claimType: ClaimType.EXPIRED_DEPOSIT_REWARD.toString(10, 16),
      claimTo: new ParseableOutput(rewardOutputOwners).serialize()
    }

    expect(removeJsonProperty(serializedClaimTx, "source")).toStrictEqual(
      removeJsonProperty(expectedJSON, "source")
    )
  })

  test("getClaimableOwnerIDs", async (): Promise<void> => {
    const actualClaimableOwnerIDs: Buffer[] = claimTx.getClaimableOwnerIDs()
    expect(actualClaimableOwnerIDs).toStrictEqual([ownerID])
  })

  test("getClaimedAmounts", async (): Promise<void> => {
    const actualClaimedAmounts: Buffer[] = claimTx.getClaimedAmounts()
    expect(actualClaimedAmounts).toStrictEqual([
      bintools.fromBNToBuffer(claimedAmount, 8)
    ])
  })

  test("getClaimTo", async (): Promise<void> => {
    const actualClaimTo: ParseableOutput = claimTx.getClaimTo()
    const expectedClaimTo = new ParseableOutput(rewardOutputOwners)
    expect(actualClaimTo.serialize()).toMatchObject(expectedClaimTo.serialize())
  })

  test("getClaimType", async (): Promise<void> => {
    expect(
      bintools
        .fromBufferToBN(claimTx.getClaimType())
        .cmp(ClaimType.EXPIRED_DEPOSIT_REWARD)
    ).toBe(0)
  })

  test("getDepositTxs", async (): Promise<void> => {
    const actualDepositTxs: Buffer[] = claimTx.getDepositTxs()
    expect(actualDepositTxs).toStrictEqual([depositTxID])
  })

  test("addSignatureIdx", async (): Promise<void> => {
    claimTx.addSignatureIdx(0, keychain.getAddresses()[0])
    const actualSigIdxs: SigIdx[] = claimTx.getSigIdxs()
    expect(actualSigIdxs.length).toBe(1)
    expect(actualSigIdxs[0].getSource()).toStrictEqual(
      keychain.getAddresses()[0]
    )
  })
})
