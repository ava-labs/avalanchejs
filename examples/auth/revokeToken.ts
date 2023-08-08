// This file read secrets from a separate file called "secrets.json"
// which you can create based on "secrets.example" which is in the
// root of the `examples/` directory.
// Unlike "secrets.example", "secrets.json" should never be committed to git.
import "dotenv/config"
import { readFile } from "fs"
import { Avalanche } from "../../src"
import { AuthAPI } from "../../src/apis/auth"

const ip = process.env.LOCAL_IP
const port = Number(process.env.LOCAL_PORT)
const protocol = process.env.LOCAL_PROTOCOL
const networkID = Number(process.env.LOCAL_NETWORK_ID)
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const auth: AuthAPI = avalanche.Auth()

const main = async (): Promise<any> => {
  const path: string = "./examples/secrets.json"
  const encoding: "utf8" = "utf8"
  const cb = async (err: any, data: any): Promise<void> => {
    if (err) throw err
    const jsonData: any = JSON.parse(data)
    const password: string = jsonData.password
    const token: string = jsonData.token
    const successful: boolean = await auth.revokeToken(password, token)
    console.log(successful)
  }
  readFile(path, encoding, cb)
}

main()
