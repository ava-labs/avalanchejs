import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';
import filesize from 'rollup-plugin-filesize';
import typescript from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';

export default {
  input: './index.ts',
  external: [
    '@scure/base',
    '@noble/hashes/utils',
    '@noble/hashes/sha256',
    '@noble/secp256k1',
    '@noble/hashes/ripemd160',
  ], // we don't want these dependencies bundled in the dist folder
  output: [
    {
      dir: 'dist',
      format: 'commonjs',
      sourcemap: process.env.BUILD === 'production' ? false : true,
    },
    {
      dir: 'dist/es',
      format: 'es',
      sourcemap: process.env.BUILD === 'production' ? false : true,
    },
  ],
  plugins: [
    filesize(),
    nodeResolve(),
    del({ targets: 'dist/*' }),
    typescript({
      typescript: ttypescript,
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        exclude: ['./test/**', '**/*.test.ts', '**/*.spec.ts'],
        // index.ts is included here and not in tsconfig.ts so relative imports
        // are imported correctly by VS Code.
        include: ['src', 'index.ts'],
        compilerOptions: {
          rootDir: './',
        },
      },
    }),
    json(),
    commonjs(),
  ],
};
