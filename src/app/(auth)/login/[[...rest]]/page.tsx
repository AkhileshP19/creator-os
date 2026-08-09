import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center">
      <SignIn path="/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
