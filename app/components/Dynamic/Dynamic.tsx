"use client";
import { FC, useEffect } from "react";
import {
  useDynamicContext,
  useSocialAccounts,
} from "@dynamic-labs/sdk-react-core";
import { ProviderEnum } from "@dynamic-labs/types";
import { DiscordIcon, FarcasterIcon, GoogleIcon } from "@dynamic-labs/iconic";
import { Separator } from "@/components/ui/separator";
import { ConnectWithEmailView } from "./ConnectEmail";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const SocialSignIn = () => {

  

  const { error, signInWithSocialAccount } = useSocialAccounts();

  return (
    <div className="flex flex-col justify-center items-center gap-8 w-full">
      <ConnectWithEmailView />
      <div className="relative w-full">
        <Separator />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card px-4 py-2 rounded-full text-sm">
          OR
        </div>
      </div>
      <div className="flex flex-row justify-center items-center gap-4">
        <button
          className="bg-input p-2 rounded-md shadow-md"
          onClick={() => signInWithSocialAccount(ProviderEnum.Farcaster)}
        >
          <FarcasterIcon className="w-8 h-8" />
        </button>
        <button
          className="bg-input p-2 rounded-md shadow-md"
          onClick={() => signInWithSocialAccount(ProviderEnum.Google)}
        >
          <GoogleIcon className="w-8 h-8" />
        </button>
        <button
          className="bg-input p-2 rounded-md shadow-md"
          onClick={() => signInWithSocialAccount(ProviderEnum.Discord)}
        >
          <DiscordIcon className="w-8 h-8 text-white" />
        </button>
      </div>
      {error && <span className="error">{error.message}</span>}
    </div>
  );
};

const LoggedInUser = () => {
  const { user } = useDynamicContext();
  const router = useRouter();

  const searchParams = useSearchParams();
  const voucherSecret = searchParams.get("voucher") ?? "";


  useEffect(() => {
    if (user) {
      router.push(`/home?voucher=${voucherSecret}`);
    }
  }, [router, user]);
  return (
    <div className="flex justify-center items-center w-full">
      <Image src="/tapify.gif" alt="Logo" width={50} height={50} />
    </div>
  );
};

export const DynamicSocialLogin: FC = () => {
  const { user } = useDynamicContext();

  return (
    <div className="fancy-box max-w-md w-full bg-transparent rounded-xl">
      <div className="bg-card flex flex-col justify-center items-center gap-4 px-6 py-5 border-2 border-border rounded-xl w-full">
        <h2 className="font-semibold text-lg mb-2">Log in or sign up</h2>

        <div className="w-full mt-4">
          {user ? <LoggedInUser /> : <SocialSignIn />}
        </div>
      </div>
    </div>
  );
};
