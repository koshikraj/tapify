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
import { Truncate } from "../utils/truncate";
import CopyString from "../utils/CopyString";
import { useEffect, useState } from "react";
import crypto from "crypto";

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
import { addVoucherData, getVoucherData, getVoucherDataById, updateVoucherData } from "../lib/voucher-middleware";
import { decryptMetadata, deriveId, encryptMetadata, VoucherMetadata } from "../lib/encryption";
import useAccountStore from "../store/voucher/voucher.store";

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
  const [voucherType, setVoucherType] = useState(0);


  // Voucher claim states
  const [ voucherMetaData, setVoucherMetaData ] = useState<VoucherMetadata>();


  const chainId = 84532;
  // const chainId = 137

  console.log(voucherSecret);

  useEffect(() => {
    (async () => {
      const account = await (primaryWallet as any)?.getWalletClient();



      try {
      const voucherData = await getVoucherDataById(deriveId(voucherSecret))
      console.log(voucherData[0].encrypted_metadata)
      setVoucherMetaData(decryptMetadata(voucherData[0].encrypted_metadata, voucherSecret))

      }
      catch {
        console.log("Invalid Voucher")
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

  async function enableSmartSession() {
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
    console.log(sessionOwner.address);

    // Update amount
    const SpendLimits = {
      token: getChainById(Number(chainId))?.tokens[1].address! as Address,
      amount: "3",
    };

    const enableSmartSession = await buildEnableSmartSession(
      chainId.toString(),
      sessionOwner.address,
      SpendLimits
    );
    calls.push(enableSmartSession);
    // const allCalls: Transaction[] = calls.concat(autoSwap);
    // console.log(allCalls);
    const txHash = await sendTransaction(chainId.toString(), calls, account);

    const encryptedData = encryptMetadata({creatorAddress: walletAddress, voucherDetails: { type: "basename"}, sessionSecretKey: sessionSecretKey, chainId}, voucherSecret)

    await addVoucherData(encryptedData.voucherId, encryptedData.encryptedMetadata, encryptedData.status)
    

    await addVoucherData(
      encryptedData.voucherId,
      encryptedData.encryptedMetadata,
      encryptedData.status
    );

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
                        // await sendAsset();
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
              className="flex flex-col gap-4 mt-0 w-full"
              value="voucher"
            >
              <div className="flex flex-row justify-between items-center w-full">
                <h2 className="font-bold text-lg">Vouchers</h2>
                <button
                  onClick={() => setShowAutoSwap(true)}
                  className="bg-slate-500 text-white text-sm px-2 py-1 rounded-lg flex flex-row justify-center items-center gap-1"
                >
                  <Plus size={12} /> Create Voucher
                </button>
              </div>
              <div className="flex flex-col gap-0">
                <div className="flex flex-row justify-between items-center border-b border-border pb-2 text-sm font-bold">
                  <h3>Type</h3>
                  <h3>Claimed</h3>
                </div>
                <div className="flex flex-col flex-grow overflow-y-scroll divide-y divider-slate-500">
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
                value={voucherType.toString()}
                onValueChange={(e) => setVoucherType(parseInt(e))}
              >
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
                      <div>Basename</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="1">
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
                  <SelectItem value="2">
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
            {voucherType === 0 ? (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm" htmlFor="">
                  Range of Letters
                </label>
                <Select defaultValue="0">
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
            ) : voucherType === 1 ? (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm" htmlFor="">
                  USDC Amount
                </label>
                <input
                  className="bg-border border-input px-3 py-2 rounded-md"
                  type="text"
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
              <h4 className="font-bold">0.001 ETH</h4>
            </div>

            <button
              onClick={async () => {
                setEnabling(true);
                await enableSmartSession();
                setEnabling(false);
              }}
              className="bg-red-200 text-red-600 flex flex-row justify-center items-center gap-4 w-full px-4 py-2.5 rounded-lg border-2 border-border font-semibold mt-2"
            >
              {enabling ? <Loading /> : "Create Voucher"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showTx} onOpenChange={setShowTx}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incoming Transaction</DialogTitle>
            <DialogDescription>
              We are swapping your incoming token to desired token.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 place-items-center gap-4 text-white text-center my-4">
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="bg-white rounded-full flex flex-row justify-center items-center gap-2">
                <Image
                  src={tokenDetails[fromToken]?.icon}
                  alt={tokenDetails[fromToken]?.name}
                  width={60}
                  height={60}
                />
              </div>
              <h3 className="font-bold">{Tokens[0].symbol}</h3>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <Image src="/tapify.gif" alt="Pacman" width={40} height={40} />
              <Link href={"/"} target="_blank" className="underline text-sm">
                View on Blockscan
              </Link>
            </div>
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="bg-white rounded-full flex flex-row justify-center items-center gap-2">
                <Image
                  src={tokenDetails[toToken]?.icon}
                  alt={tokenDetails[toToken]?.name}
                  width={60}
                  height={60}
                />
              </div>
              <h3 className="font-bold">{Tokens[1].symbol}</h3>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
