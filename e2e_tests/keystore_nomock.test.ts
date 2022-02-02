import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import Avalanche from "src"

describe("Keystore", (): void => {
  const username1: string = "avalancheJsUser1"
  const username2: string = "avalancheJsUser2"
  const username3: string = "avalancheJsUser3"
  const password: string = "avalancheJsP1ssw4rd"

  let exportedUser = { value: "" }

  const avalanche: Avalanche = getAvalanche()
  const keystore: KeystoreAPI = avalanche.NodeKeys()

  // test_name             response_promise                              resp_fn  matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "createUserWeakPass",
      () => keystore.createUser(username1, "weak"),
      (x) => x,
      Matcher.toThrow,
      () => "password is too weak"
    ],
    [
      "createUser",
      () => keystore.createUser(username1, password),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "createRepeatedUser",
      () => keystore.createUser(username1, password),
      (x) => x,
      Matcher.toThrow,
      () => "user already exists: " + username1
    ],
    [
      "listUsers",
      () => keystore.listUsers(),
      (x) => x,
      Matcher.toContain,
      () => [username1]
    ],
    [
      "exportUser",
      () => keystore.exportUser(username1, password),
      (x) => x,
      Matcher.toMatch,
      () => /\w{78}/
    ],
    [
      "getExportedUser",
      () => keystore.exportUser(username1, password),
      (x) => x,
      Matcher.Get,
      () => exportedUser
    ],
    [
      "importUser",
      () => keystore.importUser(username2, exportedUser.value, password),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "exportImportUser",
      () =>
        (async () => {
          let exported = await keystore.exportUser(username1, password)
          return await keystore.importUser(username3, exported, password)
        })(),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "listUsers2",
      () => keystore.listUsers(),
      (x) => x,
      Matcher.toContain,
      () => [username1, username2, username3]
    ],
    [
      "deleteUser1",
      () => keystore.deleteUser(username1, password),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "deleteUser2",
      () => keystore.deleteUser(username2, password),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "deleteUser3",
      () => keystore.deleteUser(username3, password),
      (x) => x,
      Matcher.toBe,
      () => true
    ]
  ]

  createTests(tests_spec)
})