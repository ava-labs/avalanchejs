const AVAX_PUBLIC_URL = process.env['AVAX_PUBLIC_URL'];
const P_CHAIN_ADDRESS = process.env['P_CHAIN_ADDRESS'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];
const X_CHAIN_ADDRESS = process.env['X_CHAIN_ADDRESS'];

export const getEnvVars = () => {
  if (!(AVAX_PUBLIC_URL && P_CHAIN_ADDRESS && PRIVATE_KEY && X_CHAIN_ADDRESS)) {
    throw new Error('Missing environment variable(s).');
  }

  return {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    X_CHAIN_ADDRESS,
  };
};
