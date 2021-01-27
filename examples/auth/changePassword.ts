import { 
  Avalanche
} from "../../dist";
import { AuthAPI } from "../../dist/apis/auth";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
const auth: AuthAPI = avalanche.Auth();
  
const main = async (): Promise<any> => {
  const oldPassword: string = "R1oJgqud0GGqe9nhip49N";
  const newPassword: string = "24j39CUm0URaquSo3bI69";
  const successful: boolean = await auth.changePassword(oldPassword, newPassword);
  console.log(successful);
}
    
main()
  