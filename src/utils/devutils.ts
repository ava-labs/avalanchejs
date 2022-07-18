import util from 'util';

// useful for printing transactions
export const printJSON = (obj: any) => {
  console.log(JSON.stringify(obj, null, 2));
};

// useful for printing nested objects
export const printDeep = (obj: any) => {
  console.log(util.inspect(obj, { depth: null, colors: true }));
};
