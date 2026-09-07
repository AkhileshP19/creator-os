"use client";

import { useState, ReactNode } from "react";
import { Header } from "@/components/header";
import { SidebarMenu } from "@/components/sidebar";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { AuthUser } from "@/types/auth-types";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isSignedIn, user, isLoaded } = useUser();

  const { data: authData } = useFetchData<AuthUser>(
    ApiEndPoint.GET_AUTH_ME,
    "auth-me",
    [],
    {},
    isLoaded && !!isSignedIn
  )

  // if (!isLoaded) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-gray-50">
  //       <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
  //     </div>
  //   );
  // }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <aside
          className={`h-[calc(100vh-64px)] shrink-0 ${isSidebarOpen ? "w-[226px]" : "w-[70px]"
            }`}
        >
          <SidebarMenu
            isSidebarOpen={isSidebarOpen}
            userName={user?.firstName || ""}
          />
        </aside>

        {/* PAGE CONTENT */}
        {children}
      </div>
    </div>
  );
}
