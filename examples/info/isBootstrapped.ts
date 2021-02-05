import { 
  Avalanche
} from "../../dist";
import { InfoAPI } from "../../dist/apis/info";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
const info: InfoAPI = avalanche.Info();
  
const main = async (): Promise<any> => {
  const chain: string = "X";
  const bootstrapped: boolean = await info.isBootstrapped(chain);
  console.log(bootstrapped);
}
    
main()
  