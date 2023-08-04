import "dotenv/config"
import { Avalanche } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip = process.env.IP
const port = Number(process.env.PORT)
const protocol = process.env.PROTOCOL
const networkID = Number(process.env.NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const txID: string = "Cgse9mcZeXrYsBGrF3SqjoDHoqxauiwxm6zrgkDa5kxSa5K85"
  const encoding: string = "json"
  const tx: string | object = await xchain.getTx(txID, encoding)
  console.log(tx)
}

main()
