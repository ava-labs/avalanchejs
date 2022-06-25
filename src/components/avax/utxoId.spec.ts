import { Id } from '../../fxs/common';
import { Int } from '../../primitives';
import { UTXOID } from '.';
import { utxoId, utxoIdBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';

testSerialization('UTXOID', UTXOID, utxoId, utxoIdBytes);

describe('UTXOID', () => {
  it('generates correct id', () => {
    expect(
      new UTXOID(
        new Id(
          '0x0400000000000000000000000000000000000000000000000000000000000000',
        ),
        new Int(0),
      ).ID(),
    ).toEqual('HBD3fiEVpzFy569fjPgGKa7GZayj1K1tSWcRs2QWE3ZfjNzWv');

    expect(
      new UTXOID(
        new Id(
          '0x0500000000000000000000000000000000000000000000000000000000000000',
        ),
        new Int(4),
      ).ID(),
    ).toEqual('ZsXUqJ1rFapUSA7mRGJqGMFPjWtx1YHdb4csN6GWL9zZZ7sGs');
  });
});
