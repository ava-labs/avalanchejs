import DB from "src/utils/db"

describe("DB", (): void => {
  test("instantiate singletone", (): void => {
    const db1: DB = DB.getInstance()
    const db2: DB = DB.getInstance()
    expect(db1).toEqual(db2)
  })
})
