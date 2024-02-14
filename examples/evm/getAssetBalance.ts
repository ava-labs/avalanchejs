import "dotenv/config"
import { Avalanche } from "../../src"
import { EVMAPI } from "../../src/apis/evm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
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
