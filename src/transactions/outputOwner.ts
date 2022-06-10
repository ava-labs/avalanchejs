import { Configs, configs, unpackv2 } from '../utils/struct';

export class OutputOwner {
  constructor(
    private locktime: bigint,
    private threshold: number,
    private addresses: string[],
  ) {}

  static fromBytes(buff: Uint8Array): OutputOwner {
    const [owner] = this.unpackBytes(buff);
    return owner;
  }

  private static unpackBytes(buff: Uint8Array): [OutputOwner, Uint8Array] {
    const [locktime, threshold, addresses, remaining] = unpackv2<
      [bigint, number, string[]]
    >(buff, [configs.bigInt, configs.int, configs.addressList]);
    return [new OutputOwner(locktime, threshold, addresses), remaining];
  }

  static unpackerConfig(): Configs {
    return {
      unpackCustom: this.unpackBytes,
    };
  }
}
