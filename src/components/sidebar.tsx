"use client";

import { sidebarOptions } from "@/config/dashboard/sidebar-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  userName: string;
}

export const SidebarMenu = ({ isSidebarOpen, userName }: SidebarMenuProps) => {
  const [activePath, setActivePath] = useState<string>("dashboard");
  const params = usePathname();
  const segment = params.split("/")[1];
  const router = useRouter();

  const strokeWidth = 2;
  const iconSize = 20;

  useEffect(() => {
    setActivePath(segment);
  }, [segment]);

  return (
    <div className="flex h-full flex-col">
      {/* ONLY THIS AREA SCROLLS */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-sm border-r",
          isSidebarOpen ? "space-y-5" : "space-y-4",
        )}
      >
        {Object.entries(sidebarOptions).map(([key, options]) => (
          <div key={key} className="flex flex-col">
            {isSidebarOpen && (
              <h3 className="mb-2 uppercase text-muted-foreground">{key}</h3>
            )}

            {Object.values(options).map((item: any) => (
              <div
                key={item.label}
                className={`flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100 ${item.label.toLowerCase() === activePath && "bg-gray-100"}`}
                onClick={() => router.push(`/${item.label.toLowerCase().replace(" ", "-")}`)}
              >
                <item.icon
                  height={iconSize}
                  width={iconSize}
                  strokeWidth={strokeWidth}
                  stroke={activePath === item.label.toLowerCase().replace(" ", "-") ? "#4f46e5" : "#000000"}
                />

                {isSidebarOpen && <p className={`font-semibold ${item.label.toLowerCase().replace(" ", "-") === activePath && "text-indigo-600"}`}>{item.label}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ALWAYS VISIBLE AT THE BOTTOM */}
      <div
        className={cn(
          "shrink-0 border-t border-r p-4",
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
