"use client";
import Image from "next/image";

export default function Page({ params }: { params: { secret: string } }) {
  const status: number = 5;
  const secret = params.secret;
  console.log(secret);

  //Loading
  if (status === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
        <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border px-6 py-4 flex flex-col gap-4">
          <h2 className="font-bold text-lg">Activating Voucher</h2>
          <div className="flex flex-col justify-center items-center gap-2">
            <Image src="/tapify.gif" alt="Logo" width={80} height={80} />
          </div>
        </div>
      </div>
    );
  }
  if (status === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
        <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border px-6 py-4 flex flex-col gap-4">
          <h2 className="font-bold text-lg"> View Data</h2>
        </div>
      </div>
    );
  }
  //Claim Basename
  if (status === 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
        <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border p-4 flex flex-col gap-4">
          <h2 className="font-bold text-lg">Claim Basename</h2>

          <div>
            <input
              type="text"
              placeholder="Enter basename"
              className="w-full bg-border border-input px-3 py-2 rounded-md"
            />
          </div>
        </div>
      </div>
    );
  }
  if (status === 4) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
        <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border px-6 py-4 flex flex-col gap-4">
          <h2 className="font-bold text-lg"> Claim Success</h2>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
      <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border px-6 py-4 flex flex-col gap-4">
        <h2 className="font-bold text-lg"> Claim Failed</h2>
      </div>
    </div>
  );
}
