"use client";

import { useState, ReactNode } from "react";
import { Header } from "@/components/header";
import { SidebarMenu } from "@/components/sidebar";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { AuthUser } from "@/types/auth-types";
import { DashboardSearchProvider } from "@/components/dashboard-search-context";
import { Button } from "@/components/ui/button";
import { Cog, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();

  const {} = useFetchData<AuthUser>(
    ApiEndPoint.GET_AUTH_ME,
    "auth-me",
    [],
    {},
    isLoaded && !!isSignedIn,
  );

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <DashboardSearchProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden relative">
          {/* DESKTOP SIDEBAR */}
          <aside
            className={`hidden md:block h-full shrink-0 border-r transition-all duration-300 ${
              isSidebarOpen ? "w-[226px]" : "w-[70px]"
            }`}
          >
            <SidebarMenu
              isSidebarOpen={isSidebarOpen}
              userName={user?.firstName || ""}
              userImageUrl={user?.imageUrl}
            />
          </aside>

          {/* MOBILE SIDEBAR BACKDROP */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* MOBILE SIDEBAR DRAWER */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-2xl flex flex-col md:hidden transition-transform duration-250 ease-out border-r ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-50 text-indigo-600">
                  <Cog className="size-5" />
                </div>
                <span className="font-bold text-lg text-foreground">
                  Creator<span className="text-indigo-600">OS</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close navigation menu"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SidebarMenu
                isSidebarOpen={true}
                userName={user?.firstName || ""}
                userImageUrl={user?.imageUrl}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>

          {/* PAGE CONTENT CONTAINER */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-muted/10 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </DashboardSearchProvider>
  );
}

