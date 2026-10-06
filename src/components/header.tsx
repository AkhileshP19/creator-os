"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Show, UserButton } from "@clerk/nextjs";
import { useDashboardSearch } from "@/components/dashboard-search-context";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cog,
  Menu,
  Search,
} from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onOpenMobileSidebar?: () => void;
}

export const Header = ({
  isSidebarOpen,
  setIsSidebarOpen,
  onOpenMobileSidebar,
}: HeaderProps) => {
  const { search, setSearch } = useDashboardSearch();
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    const segment = pathname.split("/").filter(Boolean)[0] || "dashboard";
    return segment
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }, [pathname]);

  return (
    <header className="flex h-14 border-b bg-background items-center relative z-20">
      {/* DESKTOP LOGO SECTION */}
      <div
        className={`hidden md:flex h-14 border-r items-center justify-start gap-3 px-4 transition-all duration-300 ${
          isSidebarOpen
            ? "w-[226px]"
            : "w-[70px] justify-center overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <Cog className="size-5" />
        </div>
        {isSidebarOpen && (
          <span className="font-bold text-lg text-foreground tracking-tight whitespace-nowrap">
            Creator<span className="text-indigo-600">OS</span>
          </span>
        )}
      </div>

      {/* MOBILE HEADER BAR */}
      <div className="flex md:hidden items-center gap-2 px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="text-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
        >
          <Menu className="size-5" />
        </Button>
        <div className="flex items-center gap-1.5 font-bold text-base tracking-tight text-foreground">
          <div className="flex items-center justify-center size-6 rounded bg-indigo-50 text-indigo-600">
            <Cog className="size-4" />
          </div>
          <span className="hidden xs:inline">CreatorOS</span>
        </div>
      </div>

      {/* CENTER & RIGHT SECTION */}
      <div className="flex-1 flex justify-between items-center px-3 sm:px-5 gap-2 sm:gap-4 min-w-0">
        <div className="hidden sm:block font-semibold text-base text-foreground truncate">
          {pageTitle}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <InputGroup className="w-32 xs:w-44 sm:w-60 md:w-64">
            <InputGroupInput
              placeholder="Search..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="text-xs sm:text-sm h-8 sm:h-9"
            />
            <InputGroupAddon>
              <Search className="size-3.5 sm:size-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notifications"
            className="text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer hidden xs:inline-flex"
          >
            <Bell className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Help"
            className="text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer hidden md:inline-flex"
          >
            <CircleHelp className="size-4" />
          </Button>

          <div className="flex items-center pl-1">
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR TOGGLE BUTTON */}
      <button
        type="button"
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full z-30 transition-[left] duration-300 ease-in-out cursor-pointer bg-background hover:bg-indigo-50 hover:text-indigo-600 border border-border shadow-xs items-center justify-center p-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isSidebarOpen ? "left-[214px]" : "left-[58px]"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsSidebarOpen(!isSidebarOpen);
        }}
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-3.5 w-3.5 pointer-events-none text-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 pointer-events-none text-foreground" />
        )}
      </button>
    </header>
  );
};

