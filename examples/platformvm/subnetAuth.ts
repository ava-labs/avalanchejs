import { Buffer } from "caminojs/index"
import { SubnetAuth } from "caminojs/apis/platformvm"

const address1: Buffer = Buffer.alloc(4)
const address2: Buffer = Buffer.alloc(4)
address2.writeUIntBE(0x01, 0, 4)
const subnetAuth: SubnetAuth = new SubnetAuth()
subnetAuth.addAddressIndex(address1)
subnetAuth.addAddressIndex(address2)

const main = async (): Promise<any> => {
  console.log(subnetAuth)
  const typeName: string = subnetAuth.getTypeName()
  const typeID: number = subnetAuth.getTypeID()
  const numAddressIndices: number = subnetAuth.getNumAddressIndices()
  console.log("TypeName: ", typeName)
  console.log("TypeID: ", typeID)
  console.log("NumAddressIndices: ", numAddressIndices)
}

main()
