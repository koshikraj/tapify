import GradualSpacing from "@/components/ui/gradual-spacing";
import Image from "next/image";
import { DynamicSocialLogin } from "./components/Dynamic/Dynamic";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col gap-8 md:gap-16 justify-center items-center text-white text-center">
      <div className="flex flex-col justify-center items-center gap-8 md:gap-12 max-w-72 md:max-w-md w-full">
        <Image src="/logo.svg" alt="Logo" width={250} height={250} />

        <GradualSpacing
          className="font-display text-center text-xl font-bold text-white md:text-2xl"
          text="Redefining Vouchers one tap at a time"
        />
      </div>
      <DynamicSocialLogin />
    </div>
  );
}
