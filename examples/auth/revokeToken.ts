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
  const password: string = "R1oJgqud0GGqe9nhip49N";
  const token: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MTE3MDkyMzMsIkVuZHBvaW50cyI6WyIqIl19.dvAcU0BmPzzy9lEA1wXb7rdPFN2ykayefxYc0aecH10"
  const successful: boolean = await auth.revokeToken(password, token);
  console.log(successful);
}
    
main()
  