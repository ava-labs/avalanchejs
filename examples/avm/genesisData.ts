import {
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "../../src"
import {
  AVMAPI,
  KeyChain,
  GenesisAsset,
  GenesisData,
  InitialStates,
  SECPMintOutput,
  SECPTransferOutput,
} from "../../src/apis/avm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Serialization
} from "../../src/utils"
const serialization: Serialization = Serialization.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = serialization.typeToBuffer("2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X", "cb58")
const assetAlias: string = "asset1"
const name: string = "myFixedCapAsset"
const symbol: string = "MFCA"
const denomination: number = 1

const main = async (): Promise<any> => {
  const amount: BN = new BN(100000)
  const vcapSecpOutput = new SECPTransferOutput(amount, xAddresses, locktime, threshold)
  const initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)

  const genesisAsset: GenesisAsset = new GenesisAsset(
    networkID,
    assetAlias,
    name,
    symbol,
    denomination,
    initialStates,
    memo,
  )
  const genesisAssets: GenesisAsset[] = [genesisAsset]
  const genesisData: GenesisData = new GenesisData(genesisAssets)
  console.log(genesisData.serialize("hex"))
  const b: Buffer = genesisData.toBuffer()
  console.log(b.toString("hex"))
  const cb58: string = serialization.bufferToType(b, "cb58")
  console.log(cb58)
}

main()
