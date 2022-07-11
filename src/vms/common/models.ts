export type SpendOptions = {
  minIssuanceTime?: bigint;
  changeAddresses?: string[];
  threashold: number;
  memo?: Uint8Array;
  locktime?: bigint;
};

export type SpendOptionsRequired = Required<SpendOptions>;
