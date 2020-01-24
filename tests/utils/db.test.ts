import DB from "src/utils/db";

describe("DB", () => {
    test("instantiate singletone", () => {
        let db1:DB = DB.getInstance();
        let db2:DB = DB.getInstance();
        expect(db1).toEqual(db2);
    });
});