import { hexToBuffer } from '../../utils/buffer';
import { describe, it } from 'vitest';

import { getPVMManager } from '../pvm/codec';
import { Utxo } from './utxo';

// testSerialization('Utxo', Utxo, utxo, utxoBytes);

describe('examples with real data', () => {
  it('samlpe 1', () => {
    const bytes =
      '0x00004cc3cf2e380c03f0227193a6573d1940350a43f028123ca68c14f54e33a11dcf000000093d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000160000000063af7b800000000700000002540be40000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb7f24bb9c';

    getPVMManager().unpack(hexToBuffer(bytes), Utxo);
  });
});
