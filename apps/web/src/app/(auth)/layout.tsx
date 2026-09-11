import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-900 px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        <Image src="/logo.png" alt="Nawill Pay" width={40} height={40} className="rounded-lg" />
        <span className="text-lg font-semibold text-cream-50">Nawill Pay</span>
      </div>
      <div className="w-full max-w-md rounded-xl border border-navy-700 bg-surface p-6 shadow-xl sm:p-8">
        {children}
      </div>
    </div>
  );
}
