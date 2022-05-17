import * as uvu from 'uvu';
import type {Test} from 'uvu';

export function describe(name: string, fn: (it: Test) => void) {
  const suite = uvu.suite(name);
  fn(suite);
  suite.run();
}
