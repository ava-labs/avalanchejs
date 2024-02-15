export type TypeChecker = (object: any) => boolean;

export function checkAllGuards(object: any, guards: TypeChecker[]) {
  return guards.map((checker) => checker(object));
}

export function countGuardPasses(object: any, guards: TypeChecker[]) {
  return checkAllGuards(object, guards).filter((val) => val).length;
}

export function onlyChecksOneGuard(object: any, guards: TypeChecker[]) {
  return countGuardPasses(object, guards) === 1;
}
