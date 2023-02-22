import fetch from 'node-fetch';

import { AVAX_PUBLIC_URL_FUJI } from '../src/constants/public-urls';
import { AVMApi } from '../src/vms/avm/api';
import { EVMApi } from '../src/vms/evm/api';
import { PVMApi } from '../src/vms/pvm/api';

// polyfill fetch if it doesnt exist in the global space
global.fetch = global.fetch || fetch;

export const evmapi = new EVMApi(AVAX_PUBLIC_URL_FUJI);
export const avmapi = new AVMApi(AVAX_PUBLIC_URL_FUJI);
export const pvmapi = new PVMApi(AVAX_PUBLIC_URL_FUJI);
