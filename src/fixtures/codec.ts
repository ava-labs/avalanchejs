import { Short } from '../primitives';
import { getManager } from '../vms/avm/codec';

// Check for circular imports in the fx type
// registries if tests are throwing errors

export const testManager = getManager;

export const testCodec = () => testManager().getCodecForVersion(new Short(0));
