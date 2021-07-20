import { Avalanche } from "../../src"
import { EVMAPI } from "../../src/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const address: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
  const blockHeight: string = "0x0"
  const assetID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"
  const balance: string = await cchain.getAssetBalance(
    address,
    blockHeight,
    assetID
  )
  console.log(balance)
}

main()
