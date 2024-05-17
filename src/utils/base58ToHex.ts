import { Buffer } from 'buffer';
import { base58 } from '@scure/base';

/**
 * Converts a base58 string to a hex string.
 * @param {string} base58Str - The base58 string to be converted.
 * @returns {string} - The hex string.
 * @throws {Error} - If the conversion fails.
 */
export const base58ToHex = (base58Str: string): string => {
  try {
    const decoded = base58.decode(base58Str);
    return `0x${Buffer.from(decoded).toString('hex')}`;
  } catch (error) {
    throw new Error('Failed to convert base58 to hex.');
  }
};
