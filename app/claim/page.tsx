"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getVoucherDataById,
  updateVoucherData,
} from "../lib/voucher-middleware";
import { decryptMetadata, deriveId, VoucherMetadata } from "../lib/encryption";
import {
  buildExecuteBaseNameVoucher,
  getSessionValidatorAccount,
  isNameAvailable,
  sendSessionTransaction,
  Transaction,
} from "../lib/module";
import { getJsonRpcProvider } from "../lib/web3";
import { Address, Hex } from "viem";
import { getChainById } from "../lib/tokens";
import { buildTransferToken } from "../lib/utils";
import { parseUnits } from "ethers";
import { BadgeCheck, BadgeX, Check, X } from "lucide-react";
import { CircleCheckIcon } from "../components/Icons/CircleCheckIcon";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";
import { BanIcon } from "../components/Icons/BanIcon";
import Link from "next/link";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voucherSecret = searchParams.get("voucher") ?? "";
  const [width, height] = useWindowSize();
  // Voucher claim states
  const [voucherMetaData, setVoucherMetaData] = useState<VoucherMetadata>();
  const [voucherData, setVoucherData] = useState<any>();

  const [voucherStatus, setVoucherStatus] = useState<number>(1);
  const [baseName, setBaseName] = useState<string>("");
  const [ownerAddress, setOwnerAddress] = useState<string>("");

  const [isNameAvail, setIsNameAvail] = useState<boolean>(false);
  const [mintStatus, setMintStatus] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voucherType, setVoucherType] = useState<
    "basename" | "token" | "subscription"
  >("basename");

  useEffect(() => {
    (async () => {
      try {
        const voucherData = await getVoucherDataById(deriveId(voucherSecret));
        setVoucherData(voucherData[0]);

        const voucherMetaData = decryptMetadata(
          voucherData[0].encrypted_metadata,
          voucherSecret
        );

        if (voucherData[0].status == "active") {
          setVoucherMetaData(voucherMetaData);

          if (voucherMetaData!.voucherDetails.type == "basename") {
            setVoucherStatus(2);
            setVoucherType("basename");
          } else if (voucherMetaData!.voucherDetails.type == "token") {
            setVoucherType("token");
            setVoucherStatus(3);
          }
        } else if (voucherData[0].status == "redeemed") {
          if (voucherMetaData!.voucherDetails.type == "basename") {
            router.push(
              `/profile?address=${voucherData[0].details["data"]["address"]}&name=${voucherData[0].details["data"]["name"]}`
            );
          }
          setVoucherStatus(5);
        }
      } catch {
        setVoucherStatus(5);
        console.log("Invalid Voucher");
      }
    })();
  }, []);

  async function triggerSmartSession(
    type: "basename" | "token" | "subscription" = "basename"
  ) {
    let call: Transaction;

    const provider = await getJsonRpcProvider(
      voucherMetaData!.chainId.toString()
    );
    setMintStatus(true);
    const sessionOwner = getSessionValidatorAccount(
      voucherMetaData!.sessionSecretKey as Hex
    );
    console.log(sessionOwner.address);

    if (type == "subscription" || type == "token") {
      call = {
        to: getChainById(voucherMetaData!.chainId)?.tokens[1].address!,
        value: BigInt(0),
        // Update to and amount
        data: (await buildTransferToken(
          getChainById(voucherMetaData!.chainId)?.tokens[1].address!,
          ownerAddress,
          parseUnits(
            "1",
            getChainById(voucherMetaData!.chainId)?.tokens[1].decimals
          ),
          provider
        )) as Hex,
      };
    } else {
      call = await buildExecuteBaseNameVoucher(
        voucherMetaData!.chainId.toString(),
        baseName,
        ownerAddress as Address
      );
    }

    // setShowTx(true);

    console.log(voucherMetaData!.creatorAddress);
    const txHash = await sendSessionTransaction(
      voucherMetaData!.chainId.toString(),
      [call],
      voucherMetaData!.creatorAddress as Hex,
      sessionOwner
    );
    setMintStatus(false);
    setVoucherStatus(4);
    console.log(voucherData.voucher_id);
    await updateVoucherData(
      voucherData.voucher_id,
      voucherData.encrypted_metadata,
      "redeemed",
      { type: "basename", data: { name: baseName, address: ownerAddress } }
    );

    // setShowTx(false);
  }

  //Loading
  if (voucherStatus === 1) {
    return (
      <>
        <h2 className="font-bold text-lg">Validating Voucher</h2>
        <div className="flex flex-col justify-center items-center gap-2">
          <Image
            className="animate-ping"
            src="/tapify.svg"
            alt="Logo"
            width={80}
            height={80}
          />
        </div>
      </>
    );
  }
  //Claim Basename
  if (voucherStatus === 2) {
    return (
      <>
        <h2 className="font-bold text-lg">Claim Basename</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="w-full bg-border border-input px-3 py-2 rounded-md flex flex-row justify-between items-center">
              <input
                type="text"
                placeholder="Enter basename"
                value={baseName}
                onChange={async (event) => {
                  setBaseName(event.target.value.toLowerCase());
                  if (event.target.value.length <= 9) {
                    setIsNameAvail(false);
                    return;
                  }
                  setIsLoading(true);
                  const isAvailable = await isNameAvailable(
                    voucherMetaData!.chainId.toString(),
                    event.target.value
                  );

                  setIsNameAvail(isAvailable);
                  setIsLoading(false);
                }}
                className="bg-transparent w-full"
              />
              <div className="flex flex-row justify-center items-center gap-2 text-sm">
                <span className="text-slate-400">.base.eth</span>
                <div>
                  {isNameAvail ? (
                    <BadgeCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <BadgeX className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>
            {baseName.length <= 9 && baseName.length > 0 && (
              <div className="text-xs text-red-600 px-3">
                Basename must be at least 9 characters
              </div>
            )}
          </div>
          {isNameAvail && baseName.length > 9 && (
            <input
              type="text"
              placeholder="Enter owner address"
              className="w-full bg-border border-input px-3 py-2 rounded-md"
              onChange={(event) => {
                setOwnerAddress(event.target.value);
              }}
            />
          )}

          <button
            disabled={
              !isNameAvail || baseName.length <= 9
                ? true
                : false || ownerAddress.length !== 42
            }
            className="px-6 py-2.5 bg-primary text-white w-full rounded-md shadow-md disabled:opacity-50 font-bold"
            onClick={() => {
              triggerSmartSession(voucherType);
            }}
          >
            {isLoading ? "Checking..." : mintStatus ? "Claming..." : "Claim"}
          </button>
        </div>
      </>
    );
  }

  if (voucherStatus === 3) {
    return (
      <>
        <h2 className="font-bold text-lg">Redeem Token</h2>
        <div className="flex flex-row justify-start items-center gap-2">
          <Image
            className="bg-white p-2 rounded-lg"
            src={
              getChainById(voucherMetaData!.chainId)?.tokens[1].icon ||
              "/token.png"
            }
            alt="Logo"
            width={40}
            height={40}
          />
          <input
            disabled
            className="bg-border px-4 py-2 w-full rounded-lg"
            type="text"
            value={
              voucherMetaData!.voucherDetails.spendLimit +
              "  " +
              getChainById(voucherMetaData!.chainId)?.tokens[1].name!
            }
          />
        </div>
        <input
          type="text"
          placeholder="Enter owner address"
          className="w-full bg-border border-input px-3 py-2 rounded-md"
          onChange={(event) => {
            setOwnerAddress(event.target.value);
          }}
        />
        <button
          className="bg-primary text-white text-sm px-6 py-2.5 font-bold rounded-lg flex flex-row justify-center items-center gap-1"
          onClick={() => {
            triggerSmartSession(voucherType);
          }}
        >
          {isLoading ? "Checking..." : mintStatus ? "Claming..." : "Claim"}
        </button>
      </>
    );
  }

  if (voucherStatus === 4) {
    return (
      <div className="px-4 py-6 flex flex-col gap-6">
        <CircleCheckIcon />
        <p className="font-bold text-lg w-full text-center">
          You have successfully claimed your voucher!
        </p>
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={100}
          initialVelocityX={1}
          initialVelocityY={2}
          gravity={0.1}
          tweenDuration={2000}
          colors={["#a855f7", "#efc94c", "#ff8a65", "#f7b731"]}
        />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-6 flex flex-col gap-6">
        <BanIcon />
        <p className="font-bold text-lg w-full text-center">
          The NFC voucher has been already redeemed or empty.
        </p>
        <Link
          href={`/home?voucher=${voucherSecret}`}
          className="bg-primary text-white text-sm px-6 py-2.5 font-bold rounded-lg flex flex-row justify-center items-center gap-1"
        >
          Create a new
        </Link>
      </div>
    </>
  );
}
