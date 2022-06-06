import Avalanche, { BN, Buffer } from "avalanche/dist"
import {
  AVMAPI,
  GenesisAsset,
  GenesisData,
  InitialStates,
  KeyChain,
  SECPMintOutput,
  SECPTransferOutput
} from "avalanche/dist/apis/avm"
import {
  DefaultLocalGenesisPrivateKey,
  PrivateKeyPrefix,
  Serialization,
  SerializedType
} from "avalanche/dist/utils"
const serialization: Serialization = Serialization.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const cb58: SerializedType = "cb58"
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = serialization.typeToBuffer(
  "2Zc54v4ek37TEwu4LiV3j41PUMRd6acDDU3ZCVSxE7X",
  cb58
)
let assetAlias: string = "asset1"
let name: string = "asset1"
let symbol: string = "MFCA"
let denomination: number = 1

const main = async (): Promise<any> => {
  const amount: BN = new BN(1000000000000)
  const vcapSecpOutput = new SECPTransferOutput(
    amount,
    xAddresses,
    locktime,
    threshold
  )
  let initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)

  let genesisAsset: GenesisAsset = new GenesisAsset(
    assetAlias,
    name,
    symbol,
    denomination,
    initialStates,
    memo
  )
  const genesisAssets: GenesisAsset[] = [genesisAsset]
  assetAlias = "asset2"
  name = "asset2"
  symbol = "MVCA"
  denomination = 2
  initialStates = new InitialStates()
  const secpMintOutput: SECPMintOutput = new SECPMintOutput(
    xAddresses,
    locktime,
    threshold
  )
  initialStates.addOutput(secpMintOutput)
  genesisAsset = new GenesisAsset(
    assetAlias,
    name,
    symbol,
    denomination,
    initialStates,
    memo
  )
  genesisAssets.push(genesisAsset)
  const genesisData: GenesisData = new GenesisData(genesisAssets, networkID)
  const c: string = serialization.bufferToType(genesisData.toBuffer(), cb58)
  console.log(c)
  // 111113q4vh8kDKrDmvmGm1zGBKURDLcikSCbPQBjEmfnzmW5QkZpQUAXck5gt5XCgehm4HDjgj2yiTS6nekoVUgoLkQ2hQrCwc7Y7uDC99h6ThzwMz3dCLQMmfSXyuCmqwK1fw4mPnKowzxjAjchJ6w1JSxLdhTd2R9tB3qaNTPGE5BRjkZtrMyxVvWR5qxrWPhyEqy5yjxtjG2Jva2NN34tYRePo2GdKpaTwxvxguFNGTW6kUe3pu6uKVEc8Staet1xYeUa4SZnYi5Lv6xnXvc6Sj8ve1ZyRHdHkq1rCMdyKvegUXjsaT7YVYcdAG21y8sxN3FEe7eBAcLmGa8U44bN1tB8ddCWag1tusHkYjiKivWQNyMYJsavbfP5Y8gAw51YmuYy1XbiKwLJCWnj6jNG5PZE4p4anJNy3y4tj2An5ZhH
}

main()
