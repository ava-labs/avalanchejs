import { getAVMManager } from '../serializable/avm/codec';
import { codec as EVMCodec } from '../serializable/evm/codec';
import { Short } from '../serializable/primitives';
import { codec } from '../serializable/pvm/codec';
import { codec as WarpCodec } from '../serializable/pvm/warp/codec';

// Check for circular imports in the fx type
// registries if tests are throwing errors

export const testManager = getAVMManager;

export const testCodec = () => testManager().getCodecForVersion(new Short(0));

export const testPVMCodec = () => codec;

export const testEVMCodec = () => EVMCodec;

export const testWarpCodec = () => WarpCodec;
