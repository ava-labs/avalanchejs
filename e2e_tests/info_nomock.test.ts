import { Avalanche } from "src"
import { InfoAPI } from "src/apis/info/api"
import BN from "bn.js"

describe("Info", () => {

  if (process.env.AVALANCHEGO_IP == undefined) {
    throw "undefined environment variable: AVALANCHEGO_IP"
  }
  if (process.env.AVALANCHEGO_PORT == undefined) {
    throw "undefined environment variable: AVALANCHEGO_PORT"
  }

  const avalanche = new Avalanche(
    process.env.AVALANCHEGO_IP,
    parseInt(process.env.AVALANCHEGO_PORT),
    "http"
  )
  let info = avalanche.Info()

  const defs: any = [
    ["getBlockchainID", info.getBlockchainID("X"), (x) => x,               "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"],
    ["getNetworkID",    info.getNetworkID(),       (x) => x,               "12345"],
    ["getTxFee1",       info.getTxFee(),           (x) => x.txFee,         new BN("1000000000")],
    ["getTxFee2",       info.getTxFee(),           (x) => x.creationTxFee, new BN("1000000")],
    ["getNetworkName",  info.getNetworkName(),     (x) => x,               "local"],
    ["getNodeId",       info.getNodeID(),          (x) => x,               "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"],
    ["getNodeVersion",  info.getNodeVersion(),     (x) => x,               "avalanche/1.4.12"],
    ["isBootstrapped",  info.isBootstrapped("X"),  (x) => x,               true],
    ["peers",           info.peers(),              (x) => x.length,        4],
  ]

  for (const e of defs) {
    test(e[0], async () => {
      const result = e[1]
      const response = await result
      expect(e[2](response)).toStrictEqual(e[3])
    })
  }
})
