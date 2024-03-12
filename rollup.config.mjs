import { nodeResolve } from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: './src/index.ts',
  external: [
    '@noble/hashes/ripemd160',
    '@noble/hashes/sha256',
    '@noble/hashes/utils',
    '@scure/base',
  ], // we don't want these dependencies bundled in the dist folder
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      plugins: [terser()],
      sourcemap: process.env.BUILD === 'production' ? false : true,
    },
    {
      file: 'dist/es/index.js',
      format: 'esm',
      plugins: [terser()],
      sourcemap: process.env.BUILD === 'production' ? false : true,
    },
  ],
  plugins: [filesize(), nodeResolve(), typescript()],
};
