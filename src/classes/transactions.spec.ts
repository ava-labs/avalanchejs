describe('utxo', () => {
  it('placeholder', () => {
    expect(true).toBeTruthy();
  });
  // it.skip('SecpTransferOutput', async () => {
  //   const hex =
  //     '000053db72bac8932ef64d8083c26ba612f050b472432c7a590f32cf01a6201defbd000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000007735940000000000000000000000000100000001f3faa549ef3e7d54adf26d9f422f2b4ced451a71ec6c16c1';

  //   const utxo = new Utxo(buffer.from(hex, 'hex'));

  //   expect(utxo.codecId).toEqual(0);
  //   expect(utxo.txId).toEqual(
  //     new Uint8Array([
  //       0x53, 0xdb, 0x72, 0xba, 0xc8, 0x93, 0x2e, 0xf6, 0x4d, 0x80, 0x83, 0xc2,
  //       0x6b, 0xa6, 0x12, 0xf0, 0x50, 0xb4, 0x72, 0x43, 0x2c, 0x7a, 0x59, 0x0f,
  //       0x32, 0xcf, 0x01, 0xa6, 0x20, 0x1d, 0xef, 0xbd,
  //     ]),
  //   );
  //   expect(utxo.outputIdx).toEqual(0);
  //   expect(utxo.assetId).toEqual(
  //     new Uint8Array([
  //       0x3d, 0x9b, 0xda, 0xc0, 0xed, 0x1d, 0x76, 0x13, 0x30, 0xcf, 0x68, 0x0e,
  //       0xfd, 0xeb, 0x1a, 0x42, 0x15, 0x9e, 0xb3, 0x87, 0xd6, 0xd2, 0x95, 0x0c,
  //       0x96, 0xf7, 0xd2, 0x8f, 0x61, 0xbb, 0xe2, 0xaa,
  //     ]),
  //   );

  //   expect(utxo.output.outputId).toEqual(7);
  //   expect(utxo.output.output.amount).toEqual(2_000_000_000n);

  //   expect(utxo.output.output.owners.locktime).toEqual(0n);
  //   expect(utxo.output.output.owners.threshold).toEqual(1);
  //   expect(utxo.output.output.owners.addresses).toEqual([
  //     new Uint8Array([
  //       0xf3, 0xfa, 0xa5, 0x49, 0xef, 0x3e, 0x7d, 0x54, 0xad, 0xf2, 0x6d, 0x9f,
  //       0x42, 0x2f, 0x2b, 0x4c, 0xed, 0x45, 0x1a, 0x71,
  //     ]),
  //   ]);
  // });
});
