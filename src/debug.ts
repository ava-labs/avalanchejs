// this file is placed here as a way to test out the ergonomics of the
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const main = async () => {};

main();
