import { describe, it, expect } from 'vitest';
import { testPVMCodec } from '../../fixtures/codec';
import { baseTx } from '../../fixtures/avax';
import { input } from '../../fixtures/secp256k1';
import { bytes, stringPr } from '../../fixtures/primitives';
import { id } from '../../fixtures/common';
import { makeList } from '../../fixtures/utils/makeList';
import { CreateChainTx } from './createChainTx';
import { Stringpr } from '../primitives';

describe('CreateChainTx with a non-ascii chain name', () => {
  const build = (chainName: string) =>
    new CreateChainTx(
      baseTx(),
      id(),
      new Stringpr(chainName),
      id(),
      makeList(id)(),
      bytes(),
      input(),
    );

  it.each(['Avax', 'café', '日本語', '🚀'])(
    'round trips %s through the codec with every following field intact',
    (chainName) => {
      const codec = testPVMCodec();
      const encoded = build(chainName).toBytes(codec);
      const [decoded, remainder] = CreateChainTx.fromBytes(encoded, codec);

      expect(remainder).toStrictEqual(new Uint8Array());
      expect(decoded.chainName.value()).toBe(chainName);
      // fields after the string must not have shifted
      expect(decoded.toBytes(codec)).toStrictEqual(encoded);
      expect(JSON.stringify(decoded)).toBe(JSON.stringify(build(chainName)));
    },
  );

  it('matches the ascii fixture', () => {
    expect(stringPr().value()).toBe('Avax');
  });
});
