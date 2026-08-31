"use client";

import { sidebarOptions } from "@/config/dashboard/sidebar-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  userName: string;
}

export const SidebarMenu = ({
  isSidebarOpen,
  userName,
}: SidebarMenuProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const activePath = pathname.split("/")[1] || "dashboard";

  const strokeWidth = 2;
  const iconSize = 20;

  return (
    <div className="flex h-full flex-col">
      {/* ONLY THIS AREA SCROLLS */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-r p-4 text-sm",
          isSidebarOpen ? "space-y-5" : "space-y-4",
        )}
      >
        {Object.entries(sidebarOptions).map(([key, options]) => (
          <div key={key} className="flex flex-col">
            {isSidebarOpen && (
              <h3 className="mb-2 uppercase text-muted-foreground">
                {key}
              </h3>
            )}

            {Object.values(options).map((item) => {
              const itemPath = item.label
                .toLowerCase()
                .replace(" ", "-");

              const isActive = itemPath === activePath;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100",
                    isActive && "bg-gray-100",
                  )}
                  onClick={() => router.push(`/${itemPath}`)}
                >
                  <item.icon
                    height={iconSize}
                    width={iconSize}
                    strokeWidth={strokeWidth}
                    stroke={isActive ? "#4f46e5" : "#000000"}
                  />

                  {isSidebarOpen && (
                    <p
                      className={cn(
                        "font-semibold",
                        isActive && "text-indigo-600",
                      )}
                    >
                      {item.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ALWAYS VISIBLE AT THE BOTTOM */}
      <div
        className={cn(
          "shrink-0 border-r border-t p-4",
          isSidebarOpen
            ? "flex items-center gap-3 text-sm"
            : "flex justify-center",
        )}
      >
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        {isSidebarOpen && (
          <div className="flex flex-col">
            <span>{userName}</span>
            <span className="text-muted-foreground">Creator</span>
          </div>
        )}
      </div>
    </div>
  );
};
