import { jest } from '@jest/globals';
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
    jest.resetAllMocks();
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

  describe('forEachHex', () => {
    it('iterates over the storage correctly', () => {
      const callbackMock = jest.fn();
      testMap.set(testAddress1, 3);
      testMap.set(testAddress2, 1);

      testMap.forEachHex(callbackMock);

      expect(callbackMock).toBeCalledTimes(2);
      expect(callbackMock).toHaveBeenNthCalledWith(
        1,
        3,
        testAddress1.toHex(),
        testMap.storage,
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        2,
        1,
        testAddress2.toHex(),
        testMap.storage,
      );
    });

    it('reorders and iterates over the storage correctly', () => {
      const callbackMock = jest.fn();
      testMap.set(testAddress1, 3);
      testMap.set(testAddress2, 1);

      const expectedSortedMap = new AddressMap([
        [testAddress2, 0],
        [testAddress1, 1],
      ]);

      testMap.forEachHex(callbackMock, true);

      expect(callbackMock).toBeCalledTimes(2);
      expect(callbackMock).toHaveBeenNthCalledWith(
        1,
        0,
        testAddress2.toHex(),
        expectedSortedMap.storage,
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        2,
        1,
        testAddress1.toHex(),
        expectedSortedMap.storage,
      );
    });
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

  const testMap1 = new AddressMap();
  testMap1.set(testAddress1, 3);
  testMap1.set(testAddress2, 1);
  const testMap2 = new AddressMap();
  testMap2.set(testAddress3, 2);
  testMap2.set(testAddress2, 6);

  const testAddressMaps = new AddressMaps();
  testAddressMaps.push(testMap1);
  testAddressMaps.push(testMap2);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('forEach', () => {
    it('iterates over the indices correctly', () => {
      const callbackMock = jest.fn();
      testAddressMaps.forEach(callbackMock);

      expect(callbackMock).toBeCalledTimes(3);
      expect(callbackMock).toHaveBeenNthCalledWith(
        1,
        [[0, 3]],
        testAddress1.toHex(),
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        2,
        [
          [0, 1],
          [1, 6],
        ],
        testAddress2.toHex(),
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        3,
        [[1, 2]],
        testAddress3.toHex(),
      );
    });

    it('iterates over the ordered indices correctly', () => {
      const callbackMock = jest.fn();
      testAddressMaps.forEach(callbackMock, true);

      expect(callbackMock).toBeCalledTimes(3);
      expect(callbackMock).toHaveBeenNthCalledWith(
        1,
        [
          [0, 0],
          [1, 1],
        ],
        testAddress2.toHex(),
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        2,
        [[0, 1]],
        testAddress1.toHex(),
      );
      expect(callbackMock).toHaveBeenNthCalledWith(
        3,
        [[1, 0]],
        testAddress3.toHex(),
      );
    });
  });

  it('pushes and getAddresses correctly', () => {
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

    // ordered
    expect(
      testAddressMaps.getSigIndicesForAddress(testAddress1, true),
    ).toStrictEqual([[0, 1]]);
    expect(
      testAddressMaps.getSigIndicesForAddress(testAddress2, true),
    ).toStrictEqual([
      [0, 0],
      [1, 1],
    ]);
    expect(
      testAddressMaps.getSigIndicesForAddress(testAddress3, true),
    ).toStrictEqual([[1, 0]]);

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

    // ordered
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress1, true),
    ).toStrictEqual([
      [0, 1],
      [2, 1],
    ]);
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress2, true),
    ).toStrictEqual([
      [0, 0],
      [1, 1],
      [2, 0],
      [3, 1],
    ]);
    expect(
      testAddressMaps2.getSigIndicesForAddress(testAddress3, true),
    ).toStrictEqual([
      [1, 0],
      [3, 0],
    ]);
  });
});
