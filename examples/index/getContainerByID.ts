import { 
  Avalanche
} from "../../src";
import { IndexAPI } from "../../src/apis/index";
import { 
  GetContainerByIDResponse
} from '../../src/common/interfaces';
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
const index: IndexAPI = avalanche.Index();
  
const main = async (): Promise<any> => {
  const containerID: string = "2CiVMmk7Uk1SaKzYYkrbQjiBbd7rDBUocNjpzUJxhsJ27ezJcF";
  const encoding: string = 'cb58';
  const containerByIndex: GetContainerByIDResponse = await index.getContainerByID(containerID, encoding);
  console.log(containerByIndex);
}
    
main()
  