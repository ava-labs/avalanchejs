import HDNode from "avalanche/dist/utils/hdnode"

const main = async (): Promise<any> => {
  const xpriv: string =
    "xprv9s21ZrQH143K4RH1nRkHwuVz3qGREBLobwUoUBowLDucQXm4do8jvz12agvjHrAwjJXtq9BZ87WBPUPScDBnjKvBKVQ5xbS7GQwJKW7vXLD"
  const hdnode: HDNode = new HDNode(xpriv)
  console.log(hdnode)
}

main()
