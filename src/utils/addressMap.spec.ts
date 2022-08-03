import { address } from '../fixtures/common';
import { Address } from '../serializable/fxs/common';
import { AddressMap, AddressMaps } from './addressMap';

describe('AddressMap', () => {
  const testAddress1 = address();
  const testAddress2 = Address.fromHex(
    '8db97c7cece249c2b98bdc0222cc4c2a57bf52f3',
  );
  let testMap: AddressMap;
  beforeEach(() => {
    testMap = new AddressMap();
  });
  it('sets correctly', () => {
    testMap.set(testAddress1, 3);
    testMap.set(testAddress2, 1);
    expect(testMap.get(testAddress1)).toBe(3);
    expect(testMap.get(testAddress2)).toBe(1);
    expect(testMap.get(Address.fromHex('333'))).toBeUndefined();
    expect(testMap.has(Address.fromHex('333'))).toBeFalsy();
    expect(testMap.size()).toBe(2);

    const keys: [number, Address][] = [];
    testMap.forEach((val, key) => {
      keys.push([val, key]);
    });
    expect(keys.length).toBe(2);
    expect(keys[0][0]).toBe(3);
    expect(keys[0][1].toHex()).toBe(testAddress1.toHex());
    expect(keys[1][0]).toBe(1);
    expect(keys[1][1].toHex()).toBe(testAddress2.toHex());
  });
});

describe('AddressMaps', () => {
  const testAddress1 = address();
  const testAddress2 = Address.fromHex(
    '8db97c7cece249c2b98bdc0222cc4c2a57bf52f3',
  );
  const testAddress3 = Address.fromHex(
    '8db97c7cece219c2b98bdc0222cc4c2a57bf52f3',
  );
  it('pushes and getAddresses correctly', () => {
    const testMap1 = new AddressMap();
    testMap1.set(testAddress1, 3);
    testMap1.set(testAddress2, 1);
    const testMap2 = new AddressMap();
    testMap2.set(testAddress3, 2);
    testMap2.set(testAddress2, 6);

    const testAddressMaps = new AddressMaps();
    testAddressMaps.push(testMap1);
    testAddressMaps.push(testMap2);

    expect(testAddressMaps.getSigIndicesForAddress(testAddress1)).toStrictEqual(
      [[0, 3]],
    );
    expect(testAddressMaps.getSigIndicesForAddress(testAddress2)).toStrictEqual(
      [
        [0, 1],
        [1, 6],
      ],
    );
    expect(testAddressMaps.getSigIndicesForAddress(testAddress3)).toStrictEqual(
      [[1, 2]],
    );

    const testAddressMaps2 = new AddressMaps();
    testAddressMaps.push(testMap1);
    testAddressMaps.push(testMap2);

    testAddressMaps2.merge(testAddressMaps);
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress1),
    ).toStrictEqual([
      [0, 3],
      [2, 3],
    ]);
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress2),
    ).toStrictEqual([
      [0, 1],
      [1, 6],
      [2, 1],
      [3, 6],
    ]);
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress3),
    ).toStrictEqual([
      [1, 2],
      [3, 2],
    ]);
  });
});
