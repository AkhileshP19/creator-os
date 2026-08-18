"use client";

import { useState, ReactNode } from "react";
import { Header } from "@/components/custom/header";
import { SidebarMenu } from "@/components/custom/sidebar";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = useUser();

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
            userName={user?.user?.firstName || ""}
          />
        </aside>

        {/* PAGE CONTENT */}
        {children}
      </div>
    </div>
  );
}
