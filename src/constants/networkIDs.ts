export const PlatformChainID = new Uint8Array(32);

export const MainnetName = 'mainnet';
export const CascadeName = 'cascade';
export const DenaliName = 'denali';
export const EverestName = 'everest';
export const FujiName = 'fuji';
export const TestnetName = 'testnet';
export const UnitTestName = 'testing';
export const LocalName = 'local';

export const MainnetID = 1;
export const CascadeID = 2;
export const DenaliID = 3;
export const EverestID = 4;
export const FujiID = 5;

export const TestnetID = FujiID;
export const UnitTestID = 10;
export const LocalID = 12345;

export const MainnetHRP = 'avax';
export const CascadeHRP = 'cascade';
export const DenaliHRP = 'denali';
export const EverestHRP = 'everest';
export const FujiHRP = 'fuji';
export const UnitTestHRP = 'testing';
export const LocalHRP = 'local';
export const FallbackHRP = 'custom';

export const NetworkIDToHRP = {
  [MainnetID]: MainnetHRP,
  [CascadeID]: CascadeHRP,
  [DenaliID]: DenaliHRP,
  [EverestID]: EverestHRP,
  [FujiID]: FujiHRP,
  [UnitTestID]: UnitTestHRP,
  [LocalID]: LocalHRP,
};

export const getHRP = (networkID: number): string => {
  return NetworkIDToHRP[networkID] ?? FallbackHRP;
};
