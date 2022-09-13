import { address } from '../fixtures/common';
import { OutputOwners } from '../serializable/fxs/secp256k1';
import { addressesFromBytes } from './address';
import { hexToBuffer } from './buffer';
import { matchOwners } from './matchOwners';

describe('matchOwners', () => {
  it('matches owners', () => {
    const ownerAdd: Uint8Array[] = [address().toBytes()];
    const goodOwner = OutputOwners.fromNative(ownerAdd, 0n, 1);
    const threasholdTooHigh = OutputOwners.fromNative(ownerAdd, 0n, 5);
    const wrongOwner = OutputOwners.fromNative(
      [hexToBuffer('0x12345123451234512345')],
      0n,
      5,
    );
    const locked = OutputOwners.fromNative(
      ownerAdd,
      9999999999999999999999999999999999n,
      5,
    );

    const specs = [
      {
        testCase: goodOwner,
        expect: [0],
      },
      {
        testCase: threasholdTooHigh,
        expect: undefined,
      },
      {
        testCase: locked,
        expect: undefined,
      },
      {
        testCase: wrongOwner,
        expect: undefined,
      },
    ];

    specs.forEach((spec) => {
      expect(
        matchOwners(spec.testCase, addressesFromBytes(ownerAdd), 50n)
          ?.sigIndicies,
      ).toEqual(spec.expect);
    });
  });
});
