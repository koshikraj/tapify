import { Suspense } from "react";
import Fallback from "../components/Fallback";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>;
}
