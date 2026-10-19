import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center px-4 py-8">
      <SignUp path="/sign-up" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}