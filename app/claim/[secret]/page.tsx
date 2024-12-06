"use client";
import Image from "next/image";

export default function Page({ params }: { params: { secret: string } }) {
  const status: number = 5;
  const secret = params.secret;
  console.log(secret);

  //Loading
  if (status === 1) {
    return (
      <>
        <h2 className="font-bold text-lg">Activating Voucher</h2>
        <div className="flex flex-col justify-center items-center gap-2">
          <Image src="/tapify.gif" alt="Logo" width={80} height={80} />
        </div>
      </>
    );
  }
  if (status === 2) {
    return (
      <>
        <h2 className="font-bold text-lg"> Claim Claim Data</h2>
      </>
    );
  }
  //Claim Basename
  if (status === 3) {
    return (
      <>
        <h2 className="font-bold text-lg">Claim Basename</h2>
        <div>
          <input
            type="text"
            placeholder="Enter basename"
            className="w-full bg-border border-input px-3 py-2 rounded-md"
          />
        </div>
      </>
    );
  }
  if (status === 4) {
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
