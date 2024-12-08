import { Suspense } from "react";
import Fallback from "../components/Fallback";

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>;
}
