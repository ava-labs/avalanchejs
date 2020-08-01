import DB from 'src/utils/db';

describe('DB', () => {
  test('instantiate singletone', () => {
    const db1:DB = DB.getInstance();
    const db2:DB = DB.getInstance();
    expect(db1).toEqual(db2);
  });
});
