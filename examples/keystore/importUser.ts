import { Avalanche } from "../../dist";
import { KeystoreAPI } from "../../dist/apis/keystore";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
const keystore: KeystoreAPI = avalanche.NodeKeys();
  
const main = async (): Promise<any> => {
  const username: string = "username";
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const user: string = "115mXVPYAAB6434yBs9Frw84j6HVbtxJS5RywzskeAHyjpXoZ6AnPCwGfUhduG3vuDnSVxcSKxVXmGN"
  const successful: boolean = await keystore.importUser(username, user, password);
  console.log(successful);
}
    
main()
  