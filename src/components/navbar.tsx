"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Hide the root navbar on all dashboard pages so only the dashboard's own header displays the user icon
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/publishing") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/ai-generation") ||
    pathname.startsWith("/automation") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings");

  if (isDashboardRoute) {
    return null;
  }

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16 border-b bg-background/95 backdrop-blur-sm">
      <Show when="signed-out">
        <Button
          onClick={() => router.push("/login")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 cursor-pointer shadow-sm"
        >
          Sign In
        </Button>
        <Button
          onClick={() => router.push("/sign-up")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 cursor-pointer shadow-sm"
        >
          Sign Up
        </Button>
      </Show>
      <Show when="signed-in">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
        >
          Go to Dashboard
        </Button>
        <UserButton />
      </Show>
    </header>
  );
};