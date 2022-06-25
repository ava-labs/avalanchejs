import { XChain } from '../../src/x-chain/x-chain';

async function main() {
  const xChain = new XChain();

  const output = await xChain.getUTXOs({
    addresses: ['X-avax174vq5qpa7g8g2ak0lqzx3yflxch2393h3ky782'],
  });

  return output;
}

main().then(console.log);
