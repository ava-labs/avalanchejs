import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

import { AVMApi } from '../src/vms/avm/api';
import { EVMApi } from '../src/vms/evm/api';
import { PVMApi } from '../src/vms/pvm/api';

// polyfill fetch if it doesnt exist in the global space
global.fetch = global.fetch || fetch;

export const evmapi = new EVMApi(process.env.AVAX_PUBLIC_URL);
export const avmapi = new AVMApi(process.env.AVAX_PUBLIC_URL);
export const pvmapi = new PVMApi(process.env.AVAX_PUBLIC_URL);
