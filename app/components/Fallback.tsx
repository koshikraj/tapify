import Image from "next/image";

export default function Fallback() {
  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center text-white w-full">
      <Image
        className="animate-ping"
        src="/tapify.svg"
        alt="Logo"
        width={80}
        height={80}
      />{" "}
      Loading...
    </div>
  );
}
