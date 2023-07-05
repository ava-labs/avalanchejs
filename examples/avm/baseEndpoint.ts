import { Avalanche } from "avalanche/dist"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const baseEndpoint: string = "rpc"
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
avalanche.setAddress(ip, port, protocol, baseEndpoint)

const main = async (): Promise<any> => {
  try {
    const baseEndpoint: string = avalanche.getBaseEndpoint()
    console.log(baseEndpoint)
  } catch (e: any) {
    console.log(
      "Error. Please check if all the parameters are configured correctly."
    )
  }
}

main()
