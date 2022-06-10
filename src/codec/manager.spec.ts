import { Manager, Codec } from '.';

describe('Manager', () => {
  it('registers multiple codecs', () => {
    const m = new Manager();
    m.RegisterCodec(0, new Codec());
    m.RegisterCodec(1, new Codec());
  });

  it('errors when registering a codec version twice', () => {
    const m = new Manager();
    m.RegisterCodec(0, new Codec());
    expect(() => m.RegisterCodec(0, new Codec())).toThrow(
      'duplicated codec version',
    );
  });
});
