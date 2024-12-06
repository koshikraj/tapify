import { Hex, createPublicClient, http, Chain, Transport, Address, defineChain } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { base, polygon, baseSepolia, sepolia } from 'viem/chains'
import { entryPoint07Address } from "viem/account-abstraction"


export const polygonsandbox = /*#__PURE__*/ defineChain({
  id: 1370,
  name: 'Polygon',
  nativeCurrency: { name: 'Polygon', symbol: 'POLY', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.dev.buildbear.io/exuberant-jubilee-ef9b2c59'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polygon',
      url: 'https://polygonscan.com/',
      apiUrl: 'https://api.polygonscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7654707,
    },
  },
})

import {
  createSmartAccountClient,
  SmartAccountClient
} from 'permissionless'
import {
   toSafeSmartAccount,
} from 'permissionless/accounts'
import { erc7579Actions, Erc7579Actions } from 'permissionless/actions/erc7579'
import {
  createPimlicoClient
} from 'permissionless/clients/pimlico'
// import { EntryPoint, UserOperation } from 'permissionless/types'
import { publicClient } from './utils'
import { Erc7739ActionsParameters } from 'viem/experimental'
import { NetworkUtil } from './networks'
import { MOCK_ATTESTER_ADDRESS, RHINESTONE_ATTESTER_ADDRESS } from '@rhinestone/module-sdk'


  export const getChain = (chainId: string) : Chain => {
    return [base, polygon, polygonsandbox, sepolia, baseSepolia].find((chain: any) => chain.id == chainId) as Chain;
  }
  


const getPimlicoEndpoint = (chainId: string) => {

  return NetworkUtil.getNetworkById(parseInt(chainId))?.bundler
}


export const getPimlicoClient = (chainId: string) => {

return createPimlicoClient({
	transport: http(getPimlicoEndpoint(chainId)),
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
})
}
 

interface SmartAccountClientParams {
  chainId: string;
  signer?: any;
  nonceKey?: bigint;
  address?: Hex;
  signUserOperation?: any;
  getDummySignature? : any;
  validatorAddress? : Address;
  factoryAddress? : Address;
}



export const getSmartAccountClient = async ( { chainId, nonceKey, signer, address, signUserOperation, getDummySignature  } : SmartAccountClientParams ) => {

  const chain = getChain(chainId)

  // account.signUserOperation = signUserOperation ?? account.signUserOperation
  // account.getDummySignature = getDummySignature ?? account.getDummySignature

    // Create a dummy private key signer
    const dummyPrivateKey = generatePrivateKey(); // Generate a dummy private key
    const dummySigner = privateKeyToAccount(dummyPrivateKey); // Create an account from the private key
  
    // Use the dummy signer if no signer is provided
    signer = signer || dummySigner;
  

  const client = publicClient(parseInt(chainId))
  client.chain = getChain(chainId)
  const safeAccount = await toSafeSmartAccount({
    client: client,
    owners: [signer],
    address: address,
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    // safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    // erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    safe4337ModuleAddress: "0xa58dc7a5f2ee725e71bb2c3586a12def64302c38", // With Mock registry
    erc7579LaunchpadAddress: "0x4db50a676c90cdcfaabdbf7e8d36ac4f982eb044",  // With Mock registry
    attesters: [

      "0x958543756A4c7AC6fB361f0efBfeCD98E4D297Db", // ZenGuard Attester - only for test modules
      // RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
      // MOCK_ATTESTER_ADDRESS, // Mock Attester - do not use in production
    ],
    attestersThreshold: 0,
  })




  const pimlicoClient = getPimlicoClient(chainId)
  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain: chain,
    bundlerTransport: http(getPimlicoEndpoint(chainId)),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
    },
  }).extend(erc7579Actions())

  // const pimlicoBundlerClient = await getBundlerClient(chainId)
  // const paymasterClient = await getPaymasterClient(chainId)

    // const smartAccountClient = createSmartAccountClient({
  //   account,
  //   entryPoint: ENTRYPOINT_ADDRESS_V07,
  //   bundlerTransport: http(getPimlicoEndpoint(chainId)),
  //   middleware: {
  //     gasPrice: async () =>
  //       (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
  //     ...(NetworkUtil.getNetworkById(parseInt(chainId))?.type !== "fork" ? { sponsorUserOperation: paymasterClient.sponsorUserOperation } : {})
  //   }
  // }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 })) 

  return smartAccountClient;
}


export const waitForExecution = async (chainId: string, userOperationHash: string) => {


  const pimlicoBundlerClient = await getPimlicoClient(chainId)
  const receipt = await pimlicoBundlerClient.waitForUserOperationReceipt({ hash: userOperationHash as Hex, timeout: 60000})

  return receipt;

}

