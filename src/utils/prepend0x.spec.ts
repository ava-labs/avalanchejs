import { prepend0x } from './prepend0x';

describe('prepend0x', function () {
  it('prepend if doesnt exist', () => {
    const val = '5fa820b1c7';
    const res = prepend0x(val);
    expect(res).toEqual(`0x${val}`);
  });

  it('handle if exists', () => {
    const val = '0x5fa820b1c7';
    const res = prepend0x(val);
    expect(res).toEqual(val);
  });
});
