import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import filesize from 'rollup-plugin-filesize';

export default [
  {
    input: './index.ts',
    external: [
      '@scure/base',
      '@noble/hashes/utils',
      '@noble/hashes/sha256',
      'micro-eth-signer',
      '@noble/secp256k1',
      'util',
      '@noble/hashes/ripemd160',
    ], // we don't want these dependencies bundled in the dist folder
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: process.env.BUILD === 'production' ? false : true,
    },
    plugins: [esbuild(), filesize()],
  },
  {
    input: `index.ts`,
    plugins: [dts()],
    output: {
      file: `dist/index.d.ts`,
      format: 'es',
    },
  },
];
