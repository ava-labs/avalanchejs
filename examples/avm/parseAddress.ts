import { Avalanche, Buffer } from "../../dist"
import { AVMAPI } from "../../dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const addressString: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
  const addressBuffer: Buffer = xchain.parseAddress(addressString)
  console.log(addressBuffer)
}

main()
