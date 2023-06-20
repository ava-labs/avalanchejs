import { Avalanche, BinTools } from "caminojs/index"
import { PlatformVMAPI, GetBalanceResponse } from "caminojs/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const bintools: BinTools = BinTools.getInstance()

const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let pchain: PlatformVMAPI = avalanche.PChain()
let hrp: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  hrp = avalanche.getNetwork().hrp
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const toHrp = (s: string): string => {
    return bintools.addressToString(hrp, "P", bintools.parseAddress(s, "P"))
  }

  const addresses: string[] = [
    toHrp("P-local1clz7hpsnrr6r9ukmjxn9wajgkhe3mgx8gqcm3a"),
    toHrp("P-local13w8m4qh6hay8fz3a4hzrs9k4wk4ytmfla756w2"),
    toHrp("P-local1hgjcjp3shkyxda8deyjlsde05g9fgwdk2xnwy3")
  ]
  const balance: GetBalanceResponse = await pchain.getBalance(addresses)
  console.log(JSON.stringify(balance, undefined, 2))
}

main()
