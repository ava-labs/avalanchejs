import { Avalanche, BinTools, Buffer } from "caminojs/index"
import { ExamplesConfig } from "../common/examplesConfig"
import { PlatformVMAPI } from "caminojs/apis/platformvm"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let hrp: string
let pchain: PlatformVMAPI = avalanche.PChain()

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  hrp = avalanche.getNetwork().hrp
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const bintools: BinTools = BinTools.getInstance()

  const txId = "WEYKB5nvQCxndRGHjf9QC42MNtgaeferHBhLV1stR2WP7jSVt"

  const id = bintools.cb58Decode(txId)

  const aliasId: Buffer = Buffer.from(
    createHash("ripemd160").update(id).digest()
  )

  const address = bintools.addressToString(hrp, "P", aliasId)
  console.log(address)
}

main()
