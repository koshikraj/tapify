"use client";
import Image from "next/image";
import { Truncate } from "../utils/truncate";
import { ClipboardCopy, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import CopyString from "../utils/CopyString";
export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
      <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border p-4 flex flex-col gap-4">
        <h1 className="font-bold text-lg">Profile</h1>
        <div className="flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center gap-2 w-full">
            <Image
              className="rounded-full shadow-md"
              src={"/baseprofile.svg"}
              alt="Logo"
              width={80}
              height={80}
            />
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-row justify-center items-center gap-1">
                <h2 className="font-semibold text-lg lowercase">
                  Basename.base.eth
                </h2>
                <Link href="/">
                  <ExternalLink size={16} />
                </Link>
              </div>
              <div className="flex flex-row justify-center items-center gap-2 opacity-80">
                <h3 className="font-semibold text-sm">
                  {Truncate("0x12345678900x1234567890", 20, "...")}
                </h3>
                <CopyString
                  copyText={"0x12345678900x1234567890"}
                  icon={<Copy size={16} />}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <label htmlFor="" className="text-sm w-20">
              Bio
            </label>
            <p className="bg-border rounded-lg p-3 text-sm w-full">
              Your bio is empty. Add some bio to your profile.
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <label htmlFor="" className="text-sm w-20">
              X
            </label>
            <p className="bg-border rounded-lg p-3 text-sm w-full">Add X</p>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <label htmlFor="" className="text-sm w-20">
              Farcaster
            </label>
            <p className="bg-border rounded-lg p-3 text-sm w-full">
              Add Farcaster
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <label htmlFor="" className="text-sm w-20">
              Github
            </label>
            <p className="bg-border rounded-lg p-3 text-sm w-full">
              Add Github
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full">
            <label htmlFor="" className="text-sm w-20">
              Website
            </label>
            <p className="bg-border rounded-lg p-3 text-sm w-full">
              Add Website
            </p>
          </div>
          <div className="flex flex-row justify-end items-center w-full">
            <button className="bg-primary text-black text-sm px-6 py-2.5 font-bold rounded-lg flex flex-row justify-center items-center gap-1">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
