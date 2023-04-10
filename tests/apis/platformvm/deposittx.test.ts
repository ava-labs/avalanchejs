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
import { DepositTx } from "src/apis/platformvm/depositTx"
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
let rewardOutputOwners: SECPOwnerOutput
let platformVM: PlatformVMAPI
let keychain: KeyChain
let avaxAssetID: Buffer
let secpTransferOutput: SECPTransferOutput
let secpTransferInput: SECPTransferInput
const depositTxID: Buffer = Buffer.from(
  createHash("sha256")
    .update(bintools.fromBNToBuffer(new BN(1), 32))
    .digest()
)
const depositOfferID = "wVVZinZkN9x6e9dh3DNNfrmdXaHPPwKWt3Zerx2vD8Ccuo6E7"
const depositDuration = 110376000

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

  secpTransferOutput = new SECPTransferOutput(
    new BN(1),
    [keychain.getAddresses()[0]],
    ZeroBN,
    1
  )
})
describe("DepositTx", (): void => {
  const depositTxHex: string =
    "00000001101010101010101010101010101010101010101010101010101010101010101000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070000000000000001000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001ec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc500000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500000000000000010000000100000000000000046d656d6f7bbaa2ee5087471ec98bc49fd0d7940568a060ea0c51f1a3183b4f88a0628dd1069434400000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c"
  const depositTxBuf: Buffer = Buffer.from(depositTxHex, "hex")
  const depositTx: DepositTx = new DepositTx()
  depositTx.fromBuffer(depositTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const depositTxTypeName: string = depositTx.getTypeName()
    expect(depositTxTypeName).toBe("DepositTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const depositTxTypeID: number = depositTx.getTypeID()
    expect(depositTxTypeID).toBe(PlatformVMConstants.DEPOSITTX)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = depositTx.toBuffer()
    const asvTx: DepositTx = new DepositTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedDepositTx: object = depositTx.serialize()
    const depositDurationBuf = Buffer.alloc(4)
    depositDurationBuf.writeUInt32BE(depositDuration, 0)
    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.DEPOSITTX,
      _typeName: "DepositTx",
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
      depositOfferID: bintools.cb58Decode(depositOfferID).toString("hex"),
      depositDuration: depositDurationBuf.toString("hex"),
      rewardsOwner: new ParseableOutput(rewardOutputOwners).serialize()
    }

    expect(removeJsonProperty(serializedDepositTx, "source")).toStrictEqual(
      removeJsonProperty(expectedJSON, "source")
    )
  })

  test("getDepositOfferID", async (): Promise<void> => {
    const actualDepositOfferID: Buffer = depositTx.getDepositOfferID()
    expect(actualDepositOfferID).toStrictEqual(
      bintools.cb58Decode(depositOfferID)
    )
  })

  test("getDepositDuration", async (): Promise<void> => {
    const actualDepositDuration: Buffer = depositTx.getDepositDuration()
    expect(actualDepositDuration.readUInt32BE(0)).toStrictEqual(depositDuration)
  })

  test("getRewardsOwner", async (): Promise<void> => {
    const actualRewardsOwner: ParseableOutput = depositTx.getRewardsOwner()
    expect(actualRewardsOwner.serialize()).toMatchObject(
      new ParseableOutput(rewardOutputOwners).serialize()
    )
  })
})
