import { strip0x } from './strip0x';

describe('strip0x', function () {
  it('return if doesnt exist', () => {
    const val = '5fa820b1c7';
    const res = strip0x(val);
    expect(res).toEqual(val);
  });

  it('strip if exists', () => {
    const val = '0x5fa820b1c7';
    const res = strip0x(val);
    expect(res).toEqual('5fa820b1c7');
  });
});
