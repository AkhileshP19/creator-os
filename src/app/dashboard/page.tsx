import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return <h1>Dashboard</h1>;
}
