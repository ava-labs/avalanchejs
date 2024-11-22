const AVAX_PUBLIC_URL = process.env['AVAX_PUBLIC_URL'];
const P_CHAIN_ADDRESS = process.env['P_CHAIN_ADDRESS'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];
const X_CHAIN_ADDRESS = process.env['X_CHAIN_ADDRESS'];
const C_CHAIN_ADDRESS = process.env['C_CHAIN_ADDRESS'];
const CORETH_ADDRESS = process.env['CORETH_ADDRESS'];

type PrimaryEnvKeys =
  | 'AVAX_PUBLIC_URL'
  | 'P_CHAIN_ADDRESS'
  | 'PRIVATE_KEY'
  | 'X_CHAIN_ADDRESS'
  | 'C_CHAIN_ADDRESS'
  | 'CORETH_ADDRESS';

type ExampleEnvs<T extends string> = Record<PrimaryEnvKeys | T, string>;

export const getEnvVars = <T extends string>(
  additionalEnvsKeys: T[] = [],
): ExampleEnvs<T> => {
  if (
    !(
      AVAX_PUBLIC_URL &&
      P_CHAIN_ADDRESS &&
      PRIVATE_KEY &&
      X_CHAIN_ADDRESS &&
      C_CHAIN_ADDRESS &&
      CORETH_ADDRESS
    )
  ) {
    throw new Error(
      'Missing required environment variable(s). Please check your .env file.',
    );
  }

  const additionalEnvs = additionalEnvsKeys.reduce((acc, key) => {
    const env = process.env[key];

    if (!env) {
      throw new Error(`Missing environment variable: ${key}`);
    }

    return {
      ...acc,
      [key]: env,
    };
  }, {} as Record<T, string>);

  const envs: ExampleEnvs<T> = {
    ...additionalEnvs,
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    X_CHAIN_ADDRESS,
    C_CHAIN_ADDRESS,
    CORETH_ADDRESS,
  };

  return envs;
};
