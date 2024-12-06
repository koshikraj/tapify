import type { Metadata } from "next";
import "./globals.css";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import Footer from "./components/Footer";
import Inter from "./fonts/Inter";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";

export const metadata: Metadata = {
  title: "Tapify: Create and Manage Vouchers for Crypto",
  description:
    "Tapify lets you create and manage crypto vouchers that can be claimed via NFC. Perfect for promotions, rewards, or gifting, Tapify makes crypto accessible and fun. With real-time tracking and seamless NFC redemption, it’s the easiest way to share and use digital assets!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${Inter.className} antialiased bg-background relative w-full`}
      >
        <DynamicContextProvider
          settings={{
            environmentId: "f750cf81-a1a0-4375-a9e6-e43ad79f5b3e",
            walletConnectors: [EthereumWalletConnectors],
          }}
        >
          <div className="px-4">{children}</div>
        </DynamicContextProvider>
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={
            "stroke-1 stroke-white/10 -z-10 absolute top-0 left-0 justify-center items-center"
          }
        />
        <Footer />
      </body>
    </html>
  );
}
