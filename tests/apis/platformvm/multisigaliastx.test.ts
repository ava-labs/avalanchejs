import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  KeyChain,
  MultisigAlias,
  ParseableOutput,
  PlatformVMAPI,
  PlatformVMConstants,
  SECPOwnerOutput,
  SECPTransferInput,
  SECPTransferOutput,
  SubnetAuth,
  TransferableInput,
  TransferableOutput
} from "src/apis/platformvm"
import { MultisigAliasTx } from "src/apis/platformvm/multisigaliastx"
import BinTools from "src/utils/bintools"
import {
  DefaultLocalGenesisPrivateKey,
  DefaultNetworkID,
  PrivateKeyPrefix,
  Serialization
} from "src/utils"
import createHash from "create-hash"
import { ZeroBN } from "src/common"
import Avalanche from "src/index"

const avalanche: Avalanche = new Avalanche("127.0.0.1", 9650, "https", 12345)

const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const serialization: Serialization = Serialization.getInstance()
const bintools: BinTools = BinTools.getInstance()
let platformVM: PlatformVMAPI
let keychain: KeyChain
let avaxAssetID: Buffer
let secpTransferOutput: SECPTransferOutput
let secpTransferInput: SECPTransferInput
let outputOwners: SECPOwnerOutput
const oldTxID: Buffer = Buffer.from(
  createHash("sha256")
    .update(bintools.fromBNToBuffer(new BN(1), 32))
    .digest()
)
const aliasMemo = "100"
const auth = new SubnetAuth()
let multisigAliasTx: MultisigAliasTx
let multisigAlias: MultisigAlias

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
  avaxAssetID = await platformVM.getAVAXAssetID()
  secpTransferInput = new SECPTransferInput(new BN(1))
  secpTransferInput.addSignatureIdx(0, keychain.getAddresses()[0])
  secpTransferOutput = new SECPTransferOutput(
    new BN(1),
    [keychain.getAddresses()[0]],
    ZeroBN,
    1
  )
  outputOwners = new SECPOwnerOutput([keychain.getAddresses()[0]], ZeroBN, 1)

  multisigAlias = new MultisigAlias(
    undefined,
    Buffer.from(aliasMemo, "utf-8"),
    new ParseableOutput(outputOwners)
  )

  multisigAliasTx = new MultisigAliasTx(
    1,
    Buffer.from(
      "1010101010101010101010101010101010101010101010101010101010101010",
      "hex"
    ),
    [new TransferableOutput(avaxAssetID, secpTransferOutput)],
    [
      new TransferableInput(
        oldTxID,
        Buffer.from("00000000", "hex"),
        avaxAssetID,
        secpTransferInput
      )
    ],
    Buffer.from("memo"),
    multisigAlias
  )
})
describe("MultisigAliasTx", (): void => {
  test("getTypeName", async (): Promise<void> => {
    const multisigAliasTxTypeName: string = multisigAliasTx.getTypeName()
    expect(multisigAliasTxTypeName).toBe("MultisigAliasTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const multisigAliasTxTypeID: number = multisigAliasTx.getTypeID()
    expect(multisigAliasTxTypeID).toBe(PlatformVMConstants.MULTISIGALIASTX)
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = multisigAliasTx.toBuffer()
    const asvTx: MultisigAliasTx = new MultisigAliasTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("serialize", async (): Promise<void> => {
    const serializedMultisigAliasTx: object = multisigAliasTx.serialize()

    const expectedJSON = {
      _codecID: null,
      _typeID: PlatformVMConstants.MULTISIGALIASTX,
      _typeName: "MultisigAliasTx",
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
          oldTxID,
          Buffer.from(bintools.fromBNToBuffer(new BN(0), 4)),
          avaxAssetID,
          secpTransferInput
        ).serialize()
      ],
      memo: serialization
        .typeToBuffer(bintools.cb58Encode(Buffer.from("memo")), "cb58")
        .toString("hex"),
      networkID: String(DefaultNetworkID).padStart(8, "0"),
      multisigAlias: {
        id: String("").padStart(40, "0"),
        memo: Buffer.from(aliasMemo, "utf-8").toString("hex"),
        owners: new ParseableOutput(outputOwners).serialize()
      }
    }

    expect(
      removeJsonProperty(serializedMultisigAliasTx, "source")
    ).toStrictEqual(removeJsonProperty(expectedJSON, "source"))
  })

  test("addSignatureIdx", async (): Promise<void> => {
    const multisigAliasTx = new MultisigAliasTx()
    multisigAliasTx.addSignatureIdx(0, keychain.getAddresses()[0])
    const lastSigIdx =
      multisigAliasTx.getSigIdxs()[multisigAliasTx.getSigIdxs().length - 1]
    expect(lastSigIdx["source"]).toStrictEqual(keychain.getAddresses()[0])
  })

  test("getAuth", async (): Promise<void> => {
    const actualAuth: SubnetAuth = multisigAliasTx.getAuth()
    expect(actualAuth).toStrictEqual(auth)
  })

  test("getMultisigAlias", async (): Promise<void> => {
    const actualMultisigAlias: MultisigAlias =
      multisigAliasTx.getMultisigAlias()
    expect(actualMultisigAlias).toStrictEqual(multisigAlias)
  })
})
