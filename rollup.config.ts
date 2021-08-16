// import typescript from '@rollup/plugin-typescript'
import * as typescript from "@rollup/plugin-typescript"

export default {
  input: 'src/index.ts',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    (typescript as any)()
  ]
}