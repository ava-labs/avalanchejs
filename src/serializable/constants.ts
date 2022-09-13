export const AVM = 'AVM' as const;
export const EVM = 'EVM' as const;
export const PVM = 'PVM' as const;

export type VM = typeof AVM | typeof EVM | typeof PVM;
