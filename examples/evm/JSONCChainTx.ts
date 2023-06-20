import { Avalanche, Buffer } from "caminojs/index"
import { EVMAPI, Tx } from "caminojs/apis/evm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
let cchain: EVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  cchain = avalanche.CChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const txID: string = "2jfJtniC8MpnCZTAVo4snyepds33MBGB4Yf1QiPjhCeRYv7gZ5"
  const hex: string = await cchain.getAtomicTx(txID)
  const buf: Buffer = new Buffer(hex.slice(2), "hex")
  const tx: Tx = new Tx()
  tx.fromBuffer(buf)
  const jsonStr: string = JSON.stringify(tx)
  console.log(jsonStr)
  const jsn: Object = JSON.parse(jsonStr)
  console.log(jsn)
}

main()
