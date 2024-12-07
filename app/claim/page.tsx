"use client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getVoucherDataById } from "../lib/voucher-middleware";
import { decryptMetadata, deriveId, VoucherMetadata } from "../lib/encryption";
import { buildExecuteBaseNameVoucher, getSessionValidatorAccount, isNameAvailable, sendSessionTransaction, Transaction } from "../lib/module";
import { getJsonRpcProvider } from "../lib/web3";
import { Hex } from "viem";
import { getChainById } from "../lib/tokens";
import { buildTransferToken } from "../lib/utils";
import { parseUnits } from "ethers";

export default function Page({ params }: { params: { secret: string } }) {
  const secret = params.secret;
  
  const searchParams = useSearchParams();
  const voucherSecret = searchParams.get("voucher") ?? "";

  // Voucher claim states
  const [ voucherMetaData, setVoucherMetaData ] = useState<VoucherMetadata>();
  const [ voucherStatus, setVoucherStatus ] = useState<number>(1);
  const [ baseName, setBaseName ] = useState<string>("");




  useEffect(() => {
    (async () => {



      try {
      const voucherData = await getVoucherDataById(deriveId(voucherSecret))
      if(voucherData[0].status == "active") {
      setVoucherMetaData(decryptMetadata(voucherData[0].encrypted_metadata, voucherSecret))
      setVoucherStatus(2)
      }
      }
      catch {
        console.log("Invalid Voucher")
      }
    })();
  }, []);

  async function useSmartSession(type: 'basename' | 'token' | 'subscription' = 'basename') {

    let call: Transaction;
    const provider = await getJsonRpcProvider(voucherMetaData!.chainId.toString());

    const sessionOwner =  getSessionValidatorAccount(voucherMetaData!.sessionSecretKey as Hex)
    console.log(sessionOwner.address)

    
    if(type == "subscription" || type == "token") {
      
      call = {
      to: getChainById(voucherMetaData!.chainId)?.tokens[1].address!,
      value: BigInt(0),
      // Update to and amount
      data: await buildTransferToken(getChainById(voucherMetaData!.chainId)?.tokens[1].address!, "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", parseUnits("1", getChainById(voucherMetaData!.chainId)?.tokens[1].decimals), provider) as Hex,
    }
    } else {
      call = await buildExecuteBaseNameVoucher(voucherMetaData!.chainId.toString(), baseName, "0x958543756A4c7AC6fB361f0efBfeCD98E4D297Db");
    }

    // setShowTx(true);

    console.log(voucherMetaData!.creatorAddress)
    const txHash = await sendSessionTransaction(
      voucherMetaData!.chainId.toString(),
      [call],
      voucherMetaData!.creatorAddress as Hex,
      sessionOwner
    );
    // setShowTx(false);
  }

  //Loading
  if (voucherStatus === 1) {
    return (
      <>
        <h2 className="font-bold text-lg">Loading Voucher ...</h2>
        <div className="flex flex-col justify-center items-center gap-2">
          <Image src="/tapify.gif" alt="Logo" width={80} height={80} />
        </div>
      </>
    );
  }
  //Claim Basename
  if (voucherStatus === 2) {
    return (
      <>
        <h2 className="font-bold text-lg" onClick={ ()=> { useSmartSession();}}>Claim Basename</h2>
        <div>
          <input
            type="text"
            placeholder="Enter basename"
            value={baseName}
            onChange={async (event)=> { setBaseName(event.target.value); console.log(await isNameAvailable(voucherMetaData!.chainId.toString(), event.target.value))}}
            className="w-full bg-border border-input px-3 py-2 rounded-md"
          />
        </div>
      </>
    );
  }

  if (voucherStatus === 3) {
    return (
      <>
        <h2 className="font-bold text-lg"> Claim Claim Data</h2>
      </>
    );
  }

  if (voucherStatus === 4) {
    return (
      <>
        <h2 className="font-bold text-lg"> Claim Success</h2>
      </>
    );
  }
  return (
    <>
      <h2 className="font-bold text-lg"> Claim Failed</h2>
    </>
  );
}
