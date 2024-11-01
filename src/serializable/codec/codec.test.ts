import { Codec } from '.';
import { describe, beforeEach, it, expect } from 'vitest';

import { id, idBytes } from '../../fixtures/common';
import {
  mintOutput,
  mintOutputBytes,
  outputOwner,
  outputOwnerBytes,
} from '../../fixtures/secp256k1';
import { bytesForInt } from '../../fixtures/utils/bytesFor';
import { Id } from '../fxs/common';
import { MintOutput, OutputOwners } from '../fxs/secp256k1';
import { concatBytes } from '../../utils/buffer';
import { unpack } from '../../utils/struct';

describe('Codec', () => {
  let testCodec: Codec;
  beforeEach(() => {
    testCodec = new Codec([MintOutput, OutputOwners]);
  });

  it('unpacks types correctly', () => {
    const bytes = concatBytes(bytesForInt(1), outputOwnerBytes());

    const [out, remainder] = testCodec.UnpackPrefix(bytes);

    expect(out).toStrictEqual(outputOwner());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('packs types correctly', () => {
    const owners = outputOwner();
    const bytes = concatBytes(bytesForInt(1), outputOwnerBytes());

    expect(testCodec.PackPrefix(owners)).toStrictEqual(bytes);
  });

  it('packs list of types correctly', () => {
    const input = [outputOwner(), mintOutput()];
    const output = testCodec.PackPrefixList(input);

    expect(output).toEqual(
      concatBytes(
        bytesForInt(2),
        bytesForInt(1),
        outputOwnerBytes(),
        bytesForInt(0),
        mintOutputBytes(),
      ),
    );
  });

  it('packs types correctly', () => {
    const owners = outputOwner();
    const bytes = concatBytes(bytesForInt(1), outputOwnerBytes());

    expect(testCodec.PackPrefix(owners)).toStrictEqual(bytes);
  });

  it('works with unpack', () => {
    const input = concatBytes(idBytes(), bytesForInt(1), outputOwnerBytes());
    const [idoutput, owner, remaining] = unpack(input, [Id, Codec], testCodec);
    expect(idoutput).toEqual(id());
    expect(owner).toEqual(outputOwner());
    expect(remaining).toStrictEqual(new Uint8Array());
  });
});
