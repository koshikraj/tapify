import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-row gap-2 justify-center items-center text-white text-center">
      <Image
        className="animate-ping"
        src="/tapify.svg"
        alt="Logo"
        width={30}
        height={30}
      />{" "}
      Loading...
    </div>
  );
}
