import Web3 from "Web3"

const main = async (): Promise<any> => {
  var web3 = new Web3("https://api.avax.network/ext/bc/C/rpc")
  const blockNum = await web3.eth.getBlockNumber()
  const block = await web3.eth.getBlock(blockNum)
  const txnHashes = block.transactions
  const txnCount = txnHashes.length
  const blockHash = block.hash

  console.log({
    Block: block,
    BlockNumber: blockNum,
    BlockId: blockHash,
    Txns: txnHashes
  })
}

main()
