import { AVMApi } from '../../src/vms/avm/api';

async function main() {
  const xChain = new AVMApi();

  const output = await xChain.getUTXOs({
    addresses: ['X-avax174vq5qpa7g8g2ak0lqzx3yflxch2393h3ky782'],
  });

  return output;
}

main().then(console.log);
