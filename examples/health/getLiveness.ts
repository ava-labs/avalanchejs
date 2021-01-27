import { 
  Avalanche
} from "../../src";
import { HealthAPI } from "../../src/apis/health";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
const health: HealthAPI = avalanche.Health();
  
const main = async (): Promise<any> => {
  const getLivenessResponse: object= await health.getLiveness();
  console.log(getLivenessResponse);
}
    
main()
  