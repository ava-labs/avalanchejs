import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  KeyChain,
  PlatformVMAPI,
  PlatformVMConstants,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SubnetAuth,
  TransferableInput,
  TransferableOutput
} from "src/apis/platformvm"
import { RegisterNodeTx } from "src/apis/platformvm/registernodetx"
import BinTools from "src/utils/bintools"
import {
  DefaultLocalGenesisPrivateKey,
  DefaultNetworkID,
  NodeIDStringToBuffer,
  PrivateKeyPrefix,
  Serialization
} from "src/utils"
import createHash from "create-hash"
import { SigIdx, ZeroBN } from "src/common"
import Avalanche from "src/index"
import { DepositTx } from "caminojs/apis/platformvm/depositTx"

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
const oldNodeID: string = "NodeID-DueWyGi3B9jtKfa9mPoecd4YSDJ1ftF69"
const newNodeID: string = "NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL"
let rewardOutputOwners: SECPOwnerOutput
let platformVM: PlatformVMAPI
let keychain: KeyChain
let avaxAssetID: Buffer
let secpTransferOutput: SECPTransferOutput
let secpTransferInput: SECPTransferInput
const registerNodeTxID: Buffer = Buffer.from(
  createHash("sha256")
    .update(bintools.fromBNToBuffer(new BN(1), 32))
    .digest()
)
const consortiumMemberAuth = new SubnetAuth()
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
  consortiumMemberAuth.addAddressIndex(Buffer.alloc(4)) // number conversion of 0 to empty Buffer
})
describe("RegisterNodeTx", (): void => {
  const registerNodeTxHex: string =
    "00000001101010101010101010101010101010101010101010101010101010101010101000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070000000000000001000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001ec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc500000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500000000000000010000000100000000000000046d656d6f8d9674f1301e38340110f9aa18fce80734628e3466265a60bcdae8e8c05901495551adccb27ea6990000000a00000001000000003cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c"
  const registerNodeTxBuf: Buffer = Buffer.from(registerNodeTxHex, "hex")
  const registerNodeTx: RegisterNodeTx = new RegisterNodeTx()
  registerNodeTx.fromBuffer(registerNodeTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const registerNodeTxTypeName: string = registerNodeTx.getTypeName()
    expect(registerNodeTxTypeName).toBe("RegisterNodeTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const registerNodeTxTypeID: number = registerNodeTx.getTypeID()
    expect(registerNodeTxTypeID).toBe(PlatformVMConstants.REGISTERNODETX)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = registerNodeTx.toBuffer()
    const asvTx: RegisterNodeTx = new RegisterNodeTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedRegisterNodeTx: object = registerNodeTx.serialize()
    const depositDurationBuf = Buffer.alloc(4)
    depositDurationBuf.writeUInt32BE(depositDuration, 0)
    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.REGISTERNODETX,
      _typeName: "RegisterNodeTx",
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
          registerNodeTxID,
          Buffer.from(bintools.fromBNToBuffer(new BN(0), 4)),
          avaxAssetID,
          secpTransferInput
        ).serialize()
      ],
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.from("memo")), "cb58")
        .toString("hex"),
      networkID: String(DefaultNetworkID).padStart(8, "0"),
      oldNodeID: oldNodeID,
      newNodeID: newNodeID,
      address: keychain.getAddresses()[0].toString("hex")
    }

    expect(
      removeJsonProperty(serializedRegisterNodeTx, "source")
    ).toStrictEqual(removeJsonProperty(expectedJSON, "source"))
  })

  test("addSignatureIdx", async (): Promise<void> => {
    const registerNodeTx = new RegisterNodeTx()
    registerNodeTx.addSignatureIdx(0, keychain.getAddresses()[0])
    const lastSigIdx =
      registerNodeTx.getSigIdxs()[registerNodeTx.getSigIdxs().length - 1]
    expect(lastSigIdx["source"]).toStrictEqual(keychain.getAddresses()[0])
  })

  test("getConsortiumMemberAddress", async (): Promise<void> => {
    const actualConsortiumMemberAddress: Buffer =
      registerNodeTx.getConsortiumMemberAddress()
    expect(actualConsortiumMemberAddress).toStrictEqual(
      keychain.getAddresses()[0]
    )
  })
  test("getConsortiumMemberAuth", async (): Promise<void> => {
    const actualConsortiumMemberAuth: SubnetAuth =
      registerNodeTx.getConsortiumMemberAuth()
    expect(actualConsortiumMemberAuth).toStrictEqual(consortiumMemberAuth)
  })

  test("getOldNodeID", async (): Promise<void> => {
    const actualOldNodeID: Buffer = registerNodeTx.getOldNodeID()
    expect(actualOldNodeID).toStrictEqual(NodeIDStringToBuffer(oldNodeID))
  })

  test("getNewNodeID", async (): Promise<void> => {
    const actualgetNewNodeID: Buffer = registerNodeTx.getNewNodeID()
    expect(actualgetNewNodeID).toStrictEqual(NodeIDStringToBuffer(newNodeID))
  })
})
