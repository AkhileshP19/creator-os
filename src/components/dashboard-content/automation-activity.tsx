"use client";

import { AutomationActivityData } from "@/types/dashboard-types";
import { buttonVariants } from "../ui/button";
import { Activity, Workflow } from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import Link from "next/link";

interface AutomationActivityProps {
  data: AutomationActivityData[];
}

export const AutomationActivity = ({ data }: AutomationActivityProps) => {
  const items = data || [];

  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-card shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Workflow className="size-4 text-indigo-600" />
          <h2 className="font-semibold text-base text-foreground">
            Automation Activity
          </h2>
        </div>
        <Link
          href="/automation"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs sm:text-sm h-8 px-2.5 cursor-pointer",
          })}
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No automated workflows currently active.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Activity className="size-4" />
                </div>
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="text-foreground font-medium text-sm truncate">
                    {item.name}
                  </span>
                  <div className="w-full sm:w-48 lg:w-64">
                    <Progress value={item.progress} className="h-2" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                <span className="text-xs text-muted-foreground">
                  {item.progress}%
                </span>
                <Badge
                  variant="outline"
                  className="capitalize font-medium text-xs bg-muted/60"
                >
                  {item.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};