// this file is placed here as a way to test out the ergonomics of the

import { TransferableOutput } from './serializable/avax/transferableOutput';
import type { TransferOutput } from './serializable/fxs/secp256k1';
import { AVMApi, XBuilder } from './vms/avm';
import { getContextFromURI } from './vms/context';
// sdk during dev. To run, do yarn debug
// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {
  const addresses = [
    'X-avax1nd5er8ltxt48mf3cv9w4t7lznt2jz9g50v4hn2',
    'X-avax1nyga0c4nfspr5e3czmxlsk32p7wfs7m88erg8n',
    'X-avax1nd5er8ltxt48mf3cv9w4t7lznt2jz9g50v4hn2',
    'X-avax1upk0cxjm4ch67fhngvz3phm2hvkc6hk6vvckdx',
  ];
  const { utxos } = await new AVMApi().getUTXOs({
    addresses,
  });

  console.log(utxos.map((utxo) => (utxo.output as TransferOutput).amount()));
  const context = await getContextFromURI('AVAX');
  console.log('context=', context);

  const builder = await XBuilder.fromURI();
  builder.newExportTx('P', addresses, utxos, [
    TransferableOutput.fromNative(context.avaxAssetID, 2n, 0n, 1, [
      'X-avax1upk0cxjm4ch67fhngvz3phm2hvkc6hk6vvckdx',
    ]),
  ]);
};

main();
