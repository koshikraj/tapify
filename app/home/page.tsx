"use client";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleUserRound,
  ClipboardCopy,
  IdCard,
  Plus,
  Power,
  QrCode,
  Replace,
  Settings,
  Ticket,
  Wallet,
} from "lucide-react";

import CopyString from "../utils/CopyString";
import { useEffect, useState } from "react";

import { getSmartAccountClient } from "../lib/permissionless";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildExecuteBaseNameVoucher,
  buildEnableSmartSession,
  buildSmartSessionModule,
  buildUseSmartSession,
  getRegisterPrice,
  sendSessionTransaction,
  sendTransaction,
  Transaction,
  getSessionValidatorAccount,
  generateRandomPrivateKey,
} from "../lib/module";
import { Address, Hex, parseEther, WalletClient } from "viem";
import { SmartAccountClient } from "permissionless";
import { formatEther, parseUnits, ZeroAddress } from "ethers";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Tokens from "../utils/Tokens";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import { getJsonRpcProvider } from "../lib/web3";
import { getChainById } from "../lib/tokens";
import { buildTransferToken, fixDecimal, getTokenBalance } from "../lib/utils";
import Loading from "../components/Loading";
import {
  addVoucherData,
  getVoucherData,
  getVoucherDataById,
  updateVoucherData,
} from "../lib/voucher-middleware";
import {
  decryptMetadata,
  deriveId,
  encryptMetadata,
  VoucherMetadata,
} from "../lib/encryption";
import { Truncate } from "../utils/truncate";

export default function Page() {
  const router = useRouter();
  const { handleLogOut, primaryWallet, user } = useDynamicContext();
  // const { setVoucherSecret, voucherSecret } = useAccountStore();

  const searchParams = useSearchParams();
  const voucherSecret = searchParams.get("voucher") ?? "";

  const [walletAddress, setWalletAddress] = useState<Address>(
    ZeroAddress as Address
  );
  const [accountClient, setAccountClient] = useState<any>();
  const [account, setAccount] = useState<WalletClient>();
  const [showAutoSwap, setShowAutoSwap] = useState(false);
  const [fromToken, setFromToken] = useState(2);
  const [toToken, setToToken] = useState(5);
  const [showTx, setShowTx] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [sessionSecretKey, setSessionSecretKey] = useState<Hex>("0x");
  const [tokenDetails, setTokenDetails]: any = useState([]);
  const [voucherType, setVoucherType] = useState<
    "basename" | "token" | "subscription"
  >("basename");
  const [tokenAmount, setTokenAmount] = useState<string>("0");

  // Voucher claim states
  const [voucherMetaData, setVoucherMetaData] = useState<VoucherMetadata>();

  const chainId = 8453;
  // const chainId = 97
  console.log(voucherSecret);

  useEffect(() => {
    (async () => {
      const account = await (primaryWallet as any)?.getWalletClient();

      try {
        const voucherData = await getVoucherDataById(deriveId(voucherSecret));
        console.log(voucherData[0].encrypted_metadata);
        setVoucherMetaData(
          decryptMetadata(voucherData[0].encrypted_metadata, voucherSecret)
        );
      } catch {
        console.log("Invalid Voucher");
      }

      console.log(await getVoucherData());

      const accountClient = await getSmartAccountClient({
        signer: account,
        factoryAddress: "0xE8067f399052083d60e66Ef414ddB9f166E2C100",
        validatorAddress: "0x5aec3f1c43B920a4dc21d500617fb37B8db1992C",
        chainId: chainId.toString(),
      });

      setAccount(account);
      setWalletAddress(accountClient?.account.address);
      setAccountClient(accountClient);
    })();
  }, [primaryWallet]);

  async function sendAsset() {
    const provider = await getJsonRpcProvider(chainId.toString());

    const txHash = await sendTransaction(
      chainId.toString(),
      [
        {
          to: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          value: BigInt(0),
          data: (await buildTransferToken(
            "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            parseUnits("1", 6),
            provider
          )) as Hex,
        },
      ],
      account
    );
  }

  async function triggerSmartSession(
    type: "basename" | "token" | "subscription" = "basename"
  ) {
    let call: Transaction;

    const provider = await getJsonRpcProvider(chainId.toString());
    setShowTx(true);
    const sessionOwner = getSessionValidatorAccount(sessionSecretKey as Hex);
    console.log(sessionOwner.address);

    // if (type == "subscription" || type == "token") {
    call = {
      to: getChainById(chainId)?.tokens[1].address!,
      value: BigInt(0),
      // Update to and amount
      data: (await buildTransferToken(
        getChainById(chainId)?.tokens[1].address!,
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        parseUnits("2", getChainById(chainId)?.tokens[1].decimals),
        provider
      )) as Hex,
    };
    // }
    // setShowTx(true);

    const txHash = await sendSessionTransaction(
      chainId.toString(),
      [call],
      walletAddress as Hex,
      sessionOwner
    );

    setShowTx(false);
  }

  async function enableSmartSession(
    type: "basename" | "token" | "subscription" = "basename"
  ) {
    const calls: Transaction[] = [];
    const buildSmartSession = await buildSmartSessionModule(
      chainId.toString(),
      accountClient?.account?.address!
    );
    if (buildSmartSession) {
      calls.push(buildSmartSession);
    }

    const sessionSecretKey = generateRandomPrivateKey();
    setSessionSecretKey(sessionSecretKey);
    const sessionOwner = getSessionValidatorAccount(sessionSecretKey);

    // Update amount
    const SpendLimits = {
      token: getChainById(Number(chainId))?.tokens[1].address! as Address,
      amount: tokenAmount,
    };

    const enableSmartSession = await buildEnableSmartSession(
      chainId.toString(),
      sessionOwner.address,
      type,
      SpendLimits
    );
    calls.push(enableSmartSession);
    // const allCalls: Transaction[] = calls.concat(autoSwap);
    // console.log(allCalls);
    const txHash = await sendTransaction(chainId.toString(), calls, account);

    const encryptedData = encryptMetadata(
      {
        creatorAddress: walletAddress,
        voucherDetails: { type: voucherType, spendLimit: tokenAmount },
        sessionSecretKey: sessionSecretKey,
        chainId,
      },
      voucherSecret
    );

    await addVoucherData(
      encryptedData.voucherId,
      encryptedData.encryptedMetadata,
      encryptedData.status
    );

    setShowAutoSwap(false);
    console.log(
      decryptMetadata(encryptedData.encryptedMetadata, voucherSecret)
    );
  }

  useEffect(() => {
    (async () => {
      const provider = await getJsonRpcProvider(chainId.toString());
      let tokens = getChainById(Number(chainId))?.tokens;

      let updatedTokens = [];

      if (walletAddress) {
        updatedTokens = await Promise.all(
          tokens!.map(async (token) => {
            const balance =
              token.address == ZeroAddress
                ? formatEther(await provider.getBalance(walletAddress))
                : await getTokenBalance(
                    token.address!,
                    walletAddress,
                    provider
                  );

            return {
              ...token,
              balance, // Add the balance to each token
            };
          })
        );

        setTokenDetails(updatedTokens);
      }
    })();
  }, [chainId, walletAddress]);

  useEffect(() => {
    if (!user) {
      router.push(`/?voucher=${voucherSecret}`);
    }
  }, [router, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
      <div className="fancy-box max-w-md w-full bg-transparent rounded-xl">
        <Tabs
          defaultValue="voucher"
          className="bg-card flex flex-col justify-between items-center border-2 border-border rounded-xl w-full min-h-[40rem] h-full"
        >
          <div className="flex flex-col flex-grow justify-start items-start px-6 py-5 w-full">
            <TabsContent
              className="flex flex-col gap-4 mt-0 w-full"
              value="account"
            >
              <div className="bg-border w-full rounded-lg px-4 py-2 flex flex-col justify-start items-start flex-wrap gap-1">
                <div className="flex flex-col gap-1 justify-start items-start">
                  <div>
                    <h4 className="text-slate-500 text-sm">Balance</h4>
                    <h5 className="text-4xl font-black">
                      {fixDecimal(tokenDetails[0]?.balance, 4)} ETH
                    </h5>
                  </div>
                </div>

                <div className="flex flex-row justify-start items-center gap-2 text-sm text-slate-500">
                  {Truncate(walletAddress, 22, "...")}
                  <CopyString
                    copyText={walletAddress || ""}
                    icon={<ClipboardCopy size={16} />}
                  />
                  <QrCode size={16} />
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-grow overflow-hidden">
                <Tabs defaultValue="holdings" className="w-full">
                  <TabsList className=" bg-transparent p-0 grid grid-cols-2 gap-2 w-fit">
                    <TabsTrigger
                      onClick={async () => {
                        await triggerSmartSession();
                      }}
                      className="data-[state=active]:bg-border data-[state=active]:text-white data-[state=active]:font-bold"
                      value="holdings"
                    >
                      Holdings
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="holdings">
                    <div className="flex flex-col flex-grow divide-y divider-slate-500">
                      {tokenDetails.map((token: any) => (
                        <div
                          key={token.toString()}
                          className="flex flex-row justify-between items-center py-2"
                        >
                          <div className="flex flex-row justify-start items-center gap-2">
                            <Image
                              src={token.icon}
                              alt="token"
                              height={30}
                              width={30}
                            />
                            <h4 className="font-medium">{token.name}</h4>
                          </div>
                          <div> {fixDecimal(token.balance, 4)}</div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent
              className="flex flex-col flex-grow gap-4 mt-0 w-full"
              value="voucher"
            >
              <div className="flex flex-row justify-between items-center w-full">
                <h2 className="font-bold text-lg">Vouchers</h2>
              </div>
              <div className="flex flex-col flex-grow h-full gap-0">
                <div className="flex flex-row justify-between items-center border-b border-border pb-2 text-sm font-bold">
                  <h3>Type</h3>
                  <h3>Claimed</h3>
                </div>
                <div className="flex flex-col flex-grow justify-start items-center w-full">
                  <div className="flex flex-col flex-grow overflow-y-scroll divide-y divider-slate-500 w-full">
                    <div className="flex flex-row justify-between items-center py-2">
                      <div className="flex flex-row justify-start items-center gap-2">
                        <Image
                          src={"/token.png"}
                          alt="Logo"
                          width={25}
                          height={25}
                        />
                        <h4 className="font-medium">Token</h4>
                      </div>
                      <h5>10</h5>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAutoSwap(true)}
                    className="bg-primary text-black text-sm px-6 py-2.5 font-bold rounded-lg flex flex-row justify-center items-center gap-1 mt-2"
                  >
                    <Plus size={16} /> Create Voucher
                  </button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="flex flex-grow w-full">
              <div className="flex flex-col flex-grow justify-between items-start gap-4 w-full">
                <div>Settings</div>
                <button
                  onClick={() => {
                    handleLogOut();
                    router.push("/");
                  }}
                  className="bg-red-200 text-red-600 flex flex-row justify-center items-center gap-4 w-full px-4 py-2.5 rounded-lg border-2 border-border font-semibold w-full"
                >
                  <Power /> Logout
                </button>
              </div>
            </TabsContent>
          </div>

          <TabsList className="w-full rounded-b-lg rounded-t-none bg-border grid grid-cols-3 gap-2 h-fit">
            <TabsTrigger
              className=" data-[state=active]:bg-transparent data-[state=active]:text-white"
              value="account"
            >
              <div className="flex flex-col items-center gap-1">
                <Wallet />
                <h3 className="text-sm">Wallet</h3>
              </div>
            </TabsTrigger>
            <TabsTrigger
              className=" data-[state=active]:bg-transparent data-[state=active]:text-white"
              value="voucher"
            >
              <div className="flex flex-col items-center gap-1">
                <Ticket />
                <h3 className="text-sm">Voucher</h3>
              </div>
            </TabsTrigger>
            <TabsTrigger
              className=" data-[state=active]:bg-transparent data-[state=active]:text-white"
              value="settings"
            >
              <div className="flex flex-col items-center gap-1">
                <Settings />
                <h3 className="text-sm">Settings</h3>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Dialog open={showAutoSwap} onOpenChange={setShowAutoSwap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Voucher</DialogTitle>
            <DialogDescription>
              Fill in the information below to create a claimable voucher.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 w-full text-white">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm" htmlFor="">
                Select Voucher Type
              </label>
              <Select
                value={voucherType}
                onValueChange={(e: any) => setVoucherType(e)}
              >
                <SelectTrigger className="w-full bg-border focus:outline-none focus:ring-0">
                  <SelectValue placeholder="Vocher Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basename">
                    <div className="flex flex-row justify-center items-center gap-2">
                      <Image
                        src={"/basename.png"}
                        alt="Logo"
                        width={20}
                        height={20}
                      />
                      <div>Basename</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="token">
                    <div className="flex flex-row justify-center items-center gap-2">
                      <Image
                        src={"/token.png"}
                        alt="Logo"
                        width={20}
                        height={20}
                      />
                      <div>Token</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="subscription">
                    <div className="flex flex-row justify-center items-center gap-2">
                      <Image
                        src={"/subscription.png"}
                        alt="Logo"
                        width={20}
                        height={20}
                      />
                      <div>Subscription</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {voucherType === "basename" ? (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm" htmlFor="">
                  Range of Letters
                </label>
                <Select defaultValue="2">
                  <SelectTrigger className="w-full bg-border focus:outline-none focus:ring-0">
                    <SelectValue placeholder="Vocher Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/basename.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>0-4</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="1">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/basename.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>4-9</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/basename.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>9+</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : voucherType === "token" ? (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm" htmlFor="">
                  USDC Amount
                </label>
                <input
                  className="bg-border border-input px-3 py-2 rounded-md"
                  type="text"
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmount(e.target.value);
                  }}
                  placeholder="Enter USDC amount"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm" htmlFor="">
                  Number of Months
                </label>
                <Select defaultValue="0">
                  <SelectTrigger className="w-full bg-border focus:outline-none focus:ring-0">
                    <SelectValue placeholder="Vocher Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/subscription.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>1 Month</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="1">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/subscription.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>2 Months</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex flex-row justify-center items-center gap-2">
                        <Image
                          src={"/subscription.png"}
                          alt="Logo"
                          width={20}
                          height={20}
                        />
                        <div>3 Months</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-row justify-between items-center rounded-md p-4 text-white bg-border text-sm">
              <h3>Total Amount</h3>
              <h4 className="font-bold">
                {voucherType === "token"
                  ? tokenAmount + " " + getChainById(chainId)?.tokens[1].name!
                  : "0.0001 ETH"}{" "}
              </h4>
            </div>

            <button
              onClick={async () => {
                setEnabling(true);
                await enableSmartSession(voucherType);
                setEnabling(false);
              }}
              disabled={enabling}
              className="bg-primary text-white text-sm px-6 py-2.5 font-bold rounded-lg flex flex-row justify-center items-center gap-1 disabled:opacity-50 mt-2"
            >
              {enabling ? <Loading /> : "Create Voucher"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
