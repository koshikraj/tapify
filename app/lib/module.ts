import { Contract, dataSlice, formatUnits, getAddress, getBytes, id, Interface, parseUnits, randomBytes, ZeroAddress } from "ethers";
import { getJsonRpcProvider } from "./web3";
import {  Address, Hex, SendTransactionParameters, createPublicClient, encodeAbiParameters, pad, http, toHex, concat, toBytes, SignableMessage, Account, LocalAccount, encodePacked, toFunctionSelector, PrivateKeyAccount } from "viem";
import {
    getClient,
    getModule,
    getAccount,
    installModule,
    isModuleInstalled,
    ModuleType,
    OWNABLE_VALIDATOR_ADDRESS,
    encodeValidationData,
    getOwnableValidatorMockSignature,
    SmartSessionMode,
    EnableSessionData,
    getSpendingLimitsPolicy,
    ActionData,
    encodeValidatorNonce,
    getSmartSessionsValidator,
    getOwnableValidator,
  } from "@rhinestone/module-sdk";
import { NetworkUtil } from "./networks";
import AutoSwapExecutor from "./abis/AutoSwapExecutor.json";
import SpendingLimitPolicy from "./abis/SpendingLimitPolicy.json";
import RegistrarController from "./abis/RegistrarController.json";
import SessionValidator from "./abis/SessionValidator.json";
import { computeConfigId, decodeSmartSessionSignature, encodeSmartSessionSignature, getActionId, Session, getEnableSessionsAction, getPermissionId, SMART_SESSIONS_ADDRESS } from "./smartsessions/smartsessions";
import { SmartSessionModeType } from "./smartsessions/types";


import {getChain, getSmartAccountClient } from "./permissionless";
import { buildTransferToken, getRedeemBalance, getTokenDecimals, getVaultBalance, getVaultRedeemBalance, publicClient } from "./utils";
import { getPackedUserOperation } from "permissionless";
import { getAccountNonce } from 'permissionless/actions'



// export const webAuthnModule = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06"
// export const autoSwapExecutor = "0x0285F7b1bc7ef669f5F2554e8b0DaB0ab834Fc00"

export const validatorAccount = "0xC70548d74f4A93a25b7d4754Bf536282971832c6"
export const sessionValidator = OWNABLE_VALIDATOR_ADDRESS

export const smartSession = SMART_SESSIONS_ADDRESS
export const spendLimitPolicy = "0x640D5365171fF27E75EF97CE5863c439B77De1AB"
export const uniActionPolicy = "0xF209D6e6C7b3781878bA61b1da2976f80E014815"
export const sudoPolicy = "0x6a2246FbC8C61AE6F6f55f99C44A58933Fcf712d"


export const registrarControllerAddress = "0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581"

import { getChainId, signMessage as signMessageViem } from "viem/actions"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mode } from "viem/chains";
import { entryPoint07Address, getUserOperationHash, UserOperation } from "viem/account-abstraction";


export interface Transaction {
  to: Hex;
  value: bigint;
  data: Hex;
}



export const generateRandomPrivateKey = (): Hex => {
  return generatePrivateKey(); // Convert to hex string and prepend '0x'
}

export const getSessionValidatorAccount =  (sessionPKey: Hex): PrivateKeyAccount => {

  const validator = privateKeyToAccount(sessionPKey)
  return validator;


}

export  function getSessionValidatorDetails(validatorAccount: Hex) {
   
  return { address: OWNABLE_VALIDATOR_ADDRESS, initData: encodeValidationData({
      threshold: 1,
      owners: [validatorAccount],
      })}
}


export const getSpendPolicy = async (chainId: string, configId: string, token: Address, account: Address): Promise<any> => {


  const provider = await getJsonRpcProvider(chainId)

  const spendLimit = new Contract(
      spendLimitPolicy,
      SpendingLimitPolicy.abi,
      provider
  )

  const sesionData = await spendLimit.getPolicy(smartSession, configId, token, account);
  console.log(sesionData)
  return sesionData;
}


export const getRegisterPrice = async (chainId: string, name: string, duration: bigint = BigInt(31536000)): Promise<any> => {


  const provider = await getJsonRpcProvider(chainId)

  const registrarController = new Contract(
    registrarControllerAddress,
      RegistrarController,
      provider
  )

  const sesionData = await registrarController.registerPrice(name, duration);
  console.log(sesionData)
  return sesionData;
}

export const isNameAvailable = async (chainId: string, name: string): Promise<any> => {


  const provider = await getJsonRpcProvider(chainId)

  const registrarController = new Contract(
    registrarControllerAddress,
      RegistrarController,
      provider
  )

  const available = await registrarController.available(name);
  return available;
}



async function toSessionkeyAccount(
  chainId: number,
  signerAccount: any,
  sessionDetails?: {
    mode: SmartSessionModeType;
    permissionId: Hex;
    enableSessionData?: EnableSessionData;
  }
) {
  const client = publicClient(chainId);

  const signMessage = ({ message }: { message: SignableMessage }): Promise<Hex> => {
    return signMessageViem(client, { account: signerAccount, message: message });
  };

  const signUserOperation = async (userOperation: UserOperation<"0.7">) => {
    const signature = await signMessage({
      message: {
        raw: getUserOperationHash({
          userOperation,
          entryPointAddress: entryPoint07Address,
          entryPointVersion: "0.7",
          chainId: chainId,
        }),
      },
    });

    if (!sessionDetails) {
      throw new Error("Session details are required for session transactions");
    }

    return encodeSmartSessionSignature({
      mode: sessionDetails.mode,
      permissionId: sessionDetails.permissionId,
      signature,
      enableSessionData: sessionDetails.enableSessionData,
    });
  };

  const getDummySignature = async () => {


    const signature = getOwnableValidatorMockSignature({
      threshold: 1,
    });

    if (!sessionDetails) {
      throw new Error("Session details are required for session transactions");
    }

    return encodeSmartSessionSignature({
      mode: sessionDetails.mode,
      permissionId: sessionDetails.permissionId,
      signature,
      enableSessionData: sessionDetails.enableSessionData,
    });
  };

  return {
    signMessage,
    signUserOperation,
    getDummySignature,
  };
}




export const sendTransaction = async (chainId: string, calls: Transaction[], signer: any, safeAddress?: Hex, transactionType: "normal" | "session" = "normal", sessionDetails?:  {
    mode: SmartSessionModeType
    permissionId: Hex
    enableSessionData?: EnableSessionData
  }): Promise<any> => {


    const key = BigInt(pad(smartSession as Hex, {
        dir: "right",
        size: 24,
      }) || 0
    )


    const signingAccount = await toSessionkeyAccount(parseInt(chainId), signer, sessionDetails)
    

    if (!signingAccount) {
      throw new Error('Signing account is undefined');
    }

    let smartAccount;
    if(transactionType == "normal") {

       smartAccount = await getSmartAccountClient({
        chainId,
        signer,
        address: safeAddress,
      });

    }
    else {

       smartAccount = await getSmartAccountClient({
        chainId,
        nonceKey: key,
        address: safeAddress,
        signUserOperation: signingAccount.signUserOperation,
        getDummySignature: signingAccount.getDummySignature,
      });


    }

    return await smartAccount.sendUserOperation({ calls: calls });
}





export const sendSessionTransaction = async (chainId: string, calls: Transaction[], safeAddress: Hex, sessionOwner: PrivateKeyAccount): Promise<any> => {


  // const sessionSecretKey = generateRandomPrivateKey()


  const sessionDetails = await buildUseSmartSession(sessionOwner.address)


  const key = BigInt(pad(smartSession as Hex, {
      dir: "right",
      size: 24,
    }) || 0
  )
  const client = publicClient(parseInt(chainId));

  const nonce = await getAccountNonce(client, {
    address: safeAddress,
    entryPointAddress: entryPoint07Address,
    key: key,
  })
   
  

  sessionDetails.signature = getOwnableValidatorMockSignature({
    threshold: 1,
  })

  const smartAccount = await getSmartAccountClient({
      chainId,
      address: safeAddress,
    });

    const userOperation = await smartAccount.prepareUserOperation({calls , nonce, signature: encodeSmartSessionSignature(sessionDetails) });

    const userOpHashToSign = getUserOperationHash({
      chainId: parseInt(chainId),
      entryPointAddress: entryPoint07Address,
      entryPointVersion: '0.7',
      userOperation,
    })
     
    sessionDetails.signature = await sessionOwner.signMessage({
      message: { raw: userOpHashToSign },
    })

    
     
    userOperation.signature = encodeSmartSessionSignature(sessionDetails)

  return await smartAccount.sendUserOperation(userOperation);
}





export const buildExecuteBaseNameVoucher = async (chainId: string, name: string, owner: Address): Promise<Transaction> => {

    
  const provider = await getJsonRpcProvider(chainId);

  const registrarController = new Contract(
      registrarControllerAddress,
      RegistrarController,
      provider
  )

  const request = {
    name: name,
    owner: owner,
    duration: BigInt(31536000), // One year in seconds
    resolver: '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA', // Update for mainnet
    data: [], // Empty bytes array
    reverseRecord: true
  };



  return {
      to: registrarControllerAddress,
      value: await getRegisterPrice(chainId, request.name, request.duration),
      data: (await registrarController.register.populateTransaction(request)).data as Hex
  }

}

export const buildSmartSessionModule = async (chainId: string, safeAddress: Address): Promise<Transaction | undefined> => {

    
  if(!await isInstalled(parseInt(chainId), safeAddress, smartSession, "validator")){
    
    return await buildInstallModule(parseInt(chainId), safeAddress, smartSession, "validator", "0x" )

  }
}



// export const buildExecuteAutoSwap = async (token: Address, amount: bigint): Promise<Transaction> => {

  
//   const execCallData = new Interface(AutoSwapExecutor.abi).encodeFunctionData('autoSwap', [token, amount])

//   return {
//       to: autoSwapExecutor,
//       value: BigInt(0),
//       data: execCallData as Hex
//   }
// }



export const buildUseSmartSession = async (validatorAddress: Address): Promise<{
  mode: SmartSessionModeType
  permissionId: Hex
  signature: Hex
  enableSessionData?: EnableSessionData
}> => {
 

        const validator = getSessionValidatorDetails(validatorAddress)

        const session: Session = {
          sessionValidator: validator.address,
          sessionValidatorInitData:  validator.initData,
          salt: toHex(toBytes('1', { size: 32 })),
          userOpPolicies: [],
          erc7739Policies: {
            allowedERC7739Content: [],
            erc1271Policies: [],
          },
          actions: [],
          canUsePaymaster: true,
        }

        const sessionDetails = { permissionId: getPermissionId({session}), mode: SmartSessionMode.USE, signature: '0x' as Hex }

        return sessionDetails;
}



export const buildEnableSmartSession = async (chainId: string, validatorAddress: Address, tokenLimits: {token: Address, amount: string}): Promise<Transaction> => {

    
        const provider = await getJsonRpcProvider(chainId);
        const execCallSelector = toFunctionSelector({
          name: 'transfer',
          type: 'function',
          inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
          outputs: [],
          stateMutability: 'view',
        })


        const validator = getSessionValidatorDetails(validatorAddress)
        const spendingLimitsPolicy = getSpendingLimitsPolicy([
          {
              token: tokenLimits.token,
              limit: parseUnits(tokenLimits.amount, await getTokenDecimals(tokenLimits.token, provider)),
          },
      ]);

        const spendLimitAction = {
          actionTarget: tokenLimits.token as Hex, // an address as the target of the session execution
          actionTargetSelector: execCallSelector as Hex, // function selector to be used in the execution, in this case no function selector is used
          actionPolicies: [{policy: spendLimitPolicy as Hex, initData: spendingLimitsPolicy.initData}], 
        }

        // Define the function signature
        const registerFunctionSignature = 'register((string,address,uint256,address,bytes[],bool))';
        // Get the function selector
        const registerFunctionSelector = toFunctionSelector(registerFunctionSignature);

        const uniSelectorAction = {
          actionTarget: registrarControllerAddress as Hex, // an address as the target of the session execution
          actionTargetSelector: registerFunctionSelector as Hex, // function selector to be used in the execution, in this case no function selector is used
          actionPolicies: [{policy: sudoPolicy as Hex, initData: '0x' as Hex}], 
        }

        const session: Session = {
          sessionValidator: validator.address,
          sessionValidatorInitData: validator.initData,
          salt: toHex(toBytes('1', { size: 32 })),
          userOpPolicies: [],
          erc7739Policies: {
            allowedERC7739Content: [],
            erc1271Policies: [],
          },
          actions: [
            uniSelectorAction,
          ],
          canUsePaymaster: true,
        }

        const action = getEnableSessionsAction({ sessions: [session]})

  return {
      to: action.to,
      value: BigInt(0),
      data: action.data
  }
}






export const buildInstallModule = async (chainId: number, safeAddress: Address, address: Address, type: ModuleType, initData: Hex): Promise<Transaction> => {


    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(chainId)?.url!});

    // Create the account object
    const account = getAccount({
            address: safeAddress,
            type: "safe",
        });


    const accountModule = getModule({
        module: address,
        initData: initData,
        type:  type,
      });

    const executions = await installModule({
        client,
        account,
        module: accountModule,
      });
  

      return {to: executions[0].target, value: BigInt(executions[0].value.toString()) , data: executions[0].callData}

}



export const isInstalled = async (chainId: number, safeAddress: Address, address: Address, type: ModuleType): Promise<boolean> => {



    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(chainId)?.url!});


    // Create the account object
    const account = getAccount({
            address: safeAddress,
            type: "safe",
        });


    const accountModule = getModule({
        module: address,
        initData: '0x',
        type:  type ,
      });

     
    try {  
    return await isModuleInstalled({
        client,
        account,
        module: accountModule,
      });
    }
    catch {
        return false;
    }

}
