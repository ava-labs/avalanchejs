import { Short } from '../serializable/primitives';
import { getManager } from '../serializable/avm/codec';
import { codec } from '../serializable/pvm/codec';

// Check for circular imports in the fx type
// registries if tests are throwing errors

export const testManager = getManager;

export const testCodec = () => testManager().getCodecForVersion(new Short(0));

export const testPVMCodec = () => codec;
