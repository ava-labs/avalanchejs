import { Avalanche, Buffer } from "caminojs/index"
import { AVMAPI, Tx } from "caminojs/apis/avm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)
let xchain: AVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  xchain = avalanche.XChain()
}
const main = async (): Promise<any> => {
  await InitAvalanche()
  const txID: string = "2fJer7o3HpPYxqyHXo23G4HoPvfEqcUXYojMULi2mbBEoBFqoM"
  const hex = (await xchain.getTx(txID)) as string
  const buf: Buffer = new Buffer(hex.slice(2), "hex")
  const tx: Tx = new Tx()
  tx.fromBuffer(buf)
  const jsonStr: string = JSON.stringify(tx)
  console.log(jsonStr)
  const jsn: Object = JSON.parse(jsonStr)
  console.log(jsn)
}

main()
