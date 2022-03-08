import { Avalanche } from "../../dist"
import { AVMAPI } from "../../dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const tx: string = await xchain.getTx(
    "2q6k73ptaXyaPkheENsfZ6dfPWAY46WAuZYc8sBaETL31YbSLj"
  )
  console.log(tx)
}

main()
