import { Avalanche } from "@c4tplatform/caminojs/dist"
import { PlatformVMAPI } from "@c4tplatform/caminojs/dist/apis/platformvm"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let pchain: PlatformVMAPI = avalanche.PChain()

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const address: string = "P-local1g65uqn6t77p656w64023nh8nd9updzmxyymev2"
  const addresses: string[] = [
    "P-local1clz7hpsnrr6r9ukmjxn9wajgkhe3mgx8gqcm3a",
    "P-local13w8m4qh6hay8fz3a4hzrs9k4wk4ytmfla756w2",
    "P-local1hgjcjp3shkyxda8deyjlsde05g9fgwdk2xnwy3"
  ]
  const balance: object = await pchain.getBalance({
    address,
    addresses
  })
  console.log(balance)
}

main()
