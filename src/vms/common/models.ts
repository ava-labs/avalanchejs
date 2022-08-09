export type SpendOptions = {
  minIssuanceTime?: bigint;
  changeAddresses?: Uint8Array[];
  threshold?: number;
  memo?: Uint8Array;
  locktime?: bigint;
};

export type SpendOptionsRequired = Required<SpendOptions>;

//the strign is address in hex
export type SigMapping = Map<string, number>;
export type SigMappings = SigMapping[];
