"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname.startsWith("/login");
  const isSignUpRoute = pathname.startsWith("/sign-up");
  const isAuthRoute = isLoginRoute || isSignUpRoute;

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

  if (isDashboardRoute || pathname === "/") {
    return null;
  }

  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 border-b bg-background/95 backdrop-blur-sm">
      {isAuthRoute && (
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-foreground"
          aria-label="CreatorOS home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-50">
            <Image
              src="/creatoros_logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6 object-contain"
              aria-hidden="true"
            />
          </span>
          <span>
            Creator<span className="text-indigo-600">OS</span>
          </span>
        </Link>
      )}
      <Show when="signed-out">
        {isAuthRoute ? (
          <Button
            onClick={() => router.push(isLoginRoute ? "/sign-up" : "/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 cursor-pointer shadow-sm"
          >
            {isLoginRoute ? "Sign Up" : "Sign In"}
          </Button>
        ) : (
          <>
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
          </>
        )}
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
