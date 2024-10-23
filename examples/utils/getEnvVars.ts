const AVAX_PUBLIC_URL = process.env['AVAX_PUBLIC_URL'];
const P_CHAIN_ADDRESS = process.env['P_CHAIN_ADDRESS'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];
const X_CHAIN_ADDRESS = process.env['X_CHAIN_ADDRESS'];
const C_CHAIN_ADDRESS = process.env['C_CHAIN_ADDRESS'];
const NODE_ID = process.env['NODE_ID'];
const BLS_PUBLIC_KEY = process.env['BLS_PUBLIC_KEY'];
const BLS_SIGNATURE = process.env['BLS_SIGNATURE'];
const CORETH_ADDRESS = process.env['CORETH_ADDRESS'];

export const getEnvVars = () => {
  if (
    !(
      AVAX_PUBLIC_URL &&
      P_CHAIN_ADDRESS &&
      PRIVATE_KEY &&
      X_CHAIN_ADDRESS &&
      NODE_ID &&
      BLS_PUBLIC_KEY &&
      BLS_SIGNATURE &&
      C_CHAIN_ADDRESS &&
      CORETH_ADDRESS
    )
  ) {
    throw new Error('Missing environment variable(s).');
  }

  return {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    X_CHAIN_ADDRESS,
    NODE_ID,
    BLS_PUBLIC_KEY,
    BLS_SIGNATURE,
    C_CHAIN_ADDRESS,
    CORETH_ADDRESS,
  };
};
