export default function ClaimLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white w-full">
      <div className="fancy-box max-w-md w-full rounded-xl bg-card border-2 border-border p-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
