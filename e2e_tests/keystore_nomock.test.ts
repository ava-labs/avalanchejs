import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"

describe("Keystore", (): void => {

  const username: string = "avalancheJsUser"
  const username2: string = "avalancheJsUser2"
  const password: string = "avalancheJsP1ssw4rd"

  const avalanche = getAvalanche()

  const keystore = new KeystoreAPI(avalanche)

  // test_name             response_promise                              resp_fn  matcher           expected_value
  const tests_spec: any = [
    ["createUserWeakPass", ()=>keystore.createUser(username, "weak"),    (x)=>x,  Matcher.toThrow,  "password is too weak"],
    ["createUser",         ()=>keystore.createUser(username, password),  (x)=>x,  Matcher.toBe,     true],
    ["createRepeatedUser", ()=>keystore.createUser(username, password),  (x)=>x,  Matcher.toThrow,  "user already exists: " + username],
    ["listUsers",          ()=>keystore.listUsers(),                     (x)=>x,  Matcher.toEqual,  [username]],
    ["exportUser",         ()=>keystore.exportUser(username, password),  (x)=>x,  Matcher.toMatch,  /\w{78}/],
    ["exportImportUser",   ()=>(async () => {
                             let exported = await keystore.exportUser(username, password);
                             return await keystore.importUser(username2, exported, password);
                           })(),                                         (x)=>x,  Matcher.toBe,     true],
    ["listUsers2",         ()=>keystore.listUsers(),                     (x)=>x,  Matcher.toEqual,  [username,username2]],
    ["deleteUser",         ()=>keystore.deleteUser(username, password),  (x)=>x,  Matcher.toBe,     true],
    ["deleteUser2",        ()=>keystore.deleteUser(username2, password), (x)=>x,  Matcher.toBe,     true],
  ]

  createTests(tests_spec)

})

