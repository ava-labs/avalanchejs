export const AVM = 'AVM' as const;
export const EVM = 'EVM' as const;
export const PVM = 'PVM' as const;

export type VM = typeof AVM | typeof EVM | typeof PVM;
export const ValidVMs = [AVM, EVM, PVM] as const;
