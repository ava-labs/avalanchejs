import { Avalanche } from "avalanche/dist"
import { EVMAPI } from "avalanche/dist/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const address: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
  const blockHeight: string = "latest"
  const assetID: string = "8eqonZUiJZ655TLQdhFDCqY8oV4SPDMPzqfoVMVsSNE4wSMWu"
  const balance: object = await cchain.getAssetBalance(
    address,
    blockHeight,
    assetID
  )
  console.log(balance)
}

main()
