"use client";

import { sidebarOptions } from "@/config/dashboard/sidebar-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  userName: string;
  userImageUrl?: string;
  onNavigate?: () => void;
}

export const SidebarMenu = ({
  isSidebarOpen,
  userName,
  userImageUrl,
  onNavigate,
}: SidebarMenuProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const activePath = pathname.split("/")[1] || "dashboard";

  const strokeWidth = 2;
  const iconSize = 19;

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : "CR";

  return (
    <div className="flex h-full flex-col bg-background select-none">
      {/* SCROLLABLE NAVIGATION ITEMS */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-r p-3 text-sm",
          isSidebarOpen ? "space-y-5" : "space-y-4",
        )}
      >
        {Object.entries(sidebarOptions).map(([key, options]) => (
          <div key={key} className="flex flex-col">
            {isSidebarOpen && (
              <h3 className="mb-2 px-2 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                {key}
              </h3>
            )}

            <div className="space-y-1">
              {Object.values(options).map((item) => {
                const itemPath = item.label
                  .toLowerCase()
                  .replace(" ", "-");

                const isActive = itemPath === activePath;

                return (
                  <button
                    key={item.label}
                    type="button"
                    title={!isSidebarOpen ? item.label : undefined}
                    className={cn(
                      "w-full flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 text-left",
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-indigo-50/70 hover:text-indigo-600",
                      !isSidebarOpen && "justify-center px-0",
                    )}
                    onClick={() => {
                      router.push(`/${itemPath}`);
                      onNavigate?.();
                    }}
                  >
                    <item.icon
                      height={iconSize}
                      width={iconSize}
                      strokeWidth={strokeWidth}
                      stroke={isActive ? "#ffffff" : "currentColor"}
                      className="shrink-0"
                    />

                    {isSidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* USER PROFILE INFO AT BOTTOM */}
      <div
        className={cn(
          "shrink-0 border-r border-t p-3 bg-muted/20",
          isSidebarOpen
            ? "flex items-center gap-3 text-sm"
            : "flex justify-center",
        )}
      >
        <Avatar className="size-9 border border-border">
          {userImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImageUrl} alt={userName || "User"} className="size-full object-cover rounded-full" />
          ) : (
            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        {isSidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium text-foreground text-xs sm:text-sm">
              {userName || "Creator"}
            </span>
            <span className="text-[11px] text-muted-foreground">Workspace</span>
          </div>
        )}
      </div>
    </div>
  );
};

