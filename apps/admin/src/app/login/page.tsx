import type { Metadata } from "next";
import { Logo } from "@napayment/ui/logo";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Staff sign in — Napayment Admin" };

const ERRORS: Record<string, string> = {
  "staff-only": "That account isn't a Napayment staff account, so it can't use the admin console.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-4 py-10">
      <div className="flex flex-col items-center gap-2">
        <Logo size={36} tone="cream" wordmarkClassName="text-cream" />
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">Admin console</p>
      </div>
      <div className="w-full max-w-[400px] rounded-[14px] bg-cream p-6 sm:p-8">
        <h1 className="text-[24px] font-bold leading-tight text-ink">Staff sign in</h1>
        <p className="mt-1.5 text-[14px] text-muted">For Napayment staff. Businesses use the Business Console.</p>
        <LoginForm next={next} initialError={error ? ERRORS[error] : undefined} />
      </div>
    </main>
  );
}
