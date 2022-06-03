import HDNode from "avalanche/dist/utils/hdnode"

const main = async (): Promise<any> => {
  const xpub: string =
    "xpub661MyMwAqRbcGuMUtTHJK3Sibs6ude4eyAQQGaDYtZSbHL6DBLSzUnKWRwuXU8ZhzLCNaE1WSZqJfnn1APCJcx4y5RvuyE6Upw6yTHFuARG"
  const hdnode: HDNode = new HDNode(xpub)
  console.log(hdnode)
}

main()
