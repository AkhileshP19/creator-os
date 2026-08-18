import { auth } from "@clerk/nextjs/server";
import { DashboardHeader } from "@/components/custom/dashboard-content/dashboard-header";

export default async function DashboardPage() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated) {
    await redirectToSignIn();
    return null;
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-6">
      <DashboardHeader />
    </main>
  );
}
