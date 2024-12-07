import Image from "next/image";

export default function Fallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
      <Image src="/tapify.gif" alt="Logo" width={80} height={80} /> Loading...
    </div>
  );
}
