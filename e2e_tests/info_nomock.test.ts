import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { InfoAPI } from "../src/apis/info/api"
import BN from "bn.js"
import Avalanche from "../src"
import { GetTxFee, PeersResponse } from "../src/apis/info/interfaces"

describe("Info", (): void => {

  const avalanche: Avalanche = getAvalanche()
  const info: InfoAPI = avalanche.Info()

  // test_name          response_promise               resp_fn                 matcher           expected_value/obtained_value
  const tests_spec: any[] = [
    ["getBlockchainID", () => info.getBlockchainID("X"), (blockchainID: string) => blockchainID, Matcher.toBe, () => "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"],
    ["getBlockchainID", () => info.getBlockchainID("P"), (blockchainID: string) => blockchainID, Matcher.toBe, () => "11111111111111111111111111111111LpoYY"],
    ["getBlockchainID", () => info.getBlockchainID("C"), (blockchainID: string) => blockchainID, Matcher.toBe, () => "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"],
    ["getNetworkID", () => info.getNetworkID(), (networkID: string) => networkID, Matcher.toBe, () => "12345"],
    ["getNetworkName", () => info.getNetworkName(), (networkName: string) => networkName, Matcher.toBe, () => "local"],
    ["getNodeId", () => info.getNodeID(), (nodeID: string) => nodeID, Matcher.toBe, () => "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"],
    ["getNodeVersion", () => info.getNodeVersion(), (x: string) => x, Matcher.toMatch, () => /^avalanche\/\d*\.\d*\.\d*$/],
    ["isBootstrapped", () => info.isBootstrapped("X"), (isBootstrapped: boolean) => isBootstrapped, Matcher.toBe, () => true],
    ["isBootstrapped", () => info.isBootstrapped("P"), (isBootstrapped: boolean) => isBootstrapped, Matcher.toBe, () => true],
    ["isBootstrapped", () => info.isBootstrapped("C"), (isBootstrapped: boolean) => isBootstrapped, Matcher.toBe, () => true],
    ["peers", () => info.peers(), (x: PeersResponse[]) => x.length, Matcher.toBe, () => 4],
    ["getTxFee1", () => info.getTxFee(), (x: GetTxFee) => x.txFee, Matcher.toEqual, () => new BN(1000000)],
    ["getTxFee2", () => info.getTxFee(), (x: GetTxFee) => x.creationTxFee, Matcher.toEqual, () => new BN(1000000)],
  ]

  createTests(tests_spec)

})
