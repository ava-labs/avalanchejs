import { Address } from '../serializable/fxs/common';
import { address } from '../fixtures/common';
import { OutputOwners } from '../serializable/fxs/secp256k1';
import { addressesFromBytes } from './addressesFromBytes';
import { AddressMap } from './addressMap';
import { hexToBuffer } from './buffer';
import { matchOwners } from './matchOwners';

describe('matchOwners', () => {
  it('matches owners', () => {
    const owner1 = address();
    const owner2 = Address.fromHex('7db97c7cece249c2b98bdc0226cc4c2a57bf52fc');
    const ownerAddresses: Uint8Array[] = [owner1.toBytes(), owner2.toBytes()];
    const goodOwner = OutputOwners.fromNative(ownerAddresses, 0n, 1);
    const threasholdTooHigh = OutputOwners.fromNative(ownerAddresses, 0n, 5);
    const wrongOwner = OutputOwners.fromNative(
      [hexToBuffer('0x12345123451234512345')],
      0n,
      5,
    );
    const locked = OutputOwners.fromNative(
      ownerAddresses,
      9999999999999999999999999999999999n,
      5,
    );

    const specs = [
      {
        testCase: goodOwner,
        expectedSigIndices: [0],
        expectedAddressMap: new AddressMap([[owner1, 0]]),
      },
      {
        testCase: threasholdTooHigh,
        expectedSigIndices: undefined,
        expectedAddressMap: undefined,
      },
      {
        testCase: locked,
        expectedSigIndices: undefined,
        expectedAddressMap: undefined,
      },
      {
        testCase: wrongOwner,
        expectedSigIndices: undefined,
        expectedAddressMap: undefined,
      },
      {
        testCase: goodOwner,
        sigindices: [1],
        expectedSigIndices: [1],
        expectedAddressMap: new AddressMap([[owner2, 1]]),
      },
      {
        testCase: goodOwner,
        sigindices: [2],
        expectedSigIndices: undefined,
        expectedAddressMap: undefined,
      },
    ];

    specs.forEach((spec) => {
      const result = matchOwners(
        spec.testCase,
        addressesFromBytes(ownerAddresses),
        50n,
        spec.sigindices,
      );
      expect(result?.sigIndicies).toEqual(spec.expectedSigIndices);
      expect(result?.addressMap).toEqual(spec.expectedAddressMap);
    });
  });
});
