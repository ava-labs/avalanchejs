import { Avalanche } from "avalanche/dist"
import { AVMAPI } from "avalanche/dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  try {
    const assetDescription: any = await xchain.getAssetDescription("AVAX")
    console.log(assetDescription)
  } catch (e: any) {
    console.log(
      "Error. Please check if all the parameters are configured correctly."
    )
  }
}

main()
