"use client"

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { getHours } from "date-fns";
import { Lightbulb, Plus, Sparkles, Workflow } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface DashboardHeaderProps {
  setIsCreateProjectModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardHeader = ({ setIsCreateProjectModalOpen }: DashboardHeaderProps) => {
  const user = useUser();

  const hour = getHours(new Date());
  let time: string;
  if (hour < 12) {
    time = "morning";
  } else if (hour < 17) {
    time = "afternoon";
  } else if (hour < 21) {
    time = "evening";
  } else {
    time = "night";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
            Good {time}, {user.user?.firstName || "Creator"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your CreatorOS workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/80 hover:text-indigo-800 transition-colors cursor-pointer text-xs sm:text-sm h-10 px-3.5"
          >
            <Sparkles className="size-4 text-indigo-600" />
            Generate Content
          </Button>
          <Button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer text-xs sm:text-sm h-10 px-4"
          >
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Button
          variant="outline"
          onClick={() => setIsCreateProjectModalOpen(true)}
          className="h-11 sm:h-12 px-3 text-xs sm:text-sm font-medium border-border hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all justify-start sm:justify-center cursor-pointer shadow-2xs"
        >
          <Plus className="size-4 text-indigo-600 shrink-0" />
          <span className="truncate">Create Project</span>
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-12 px-3 text-xs sm:text-sm font-medium border-border hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all justify-start sm:justify-center cursor-pointer shadow-2xs"
        >
          <Lightbulb className="size-4 text-indigo-600 shrink-0" />
          <span className="truncate">Add Idea</span>
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-12 px-3 text-xs sm:text-sm font-medium border-border hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all justify-start sm:justify-center cursor-pointer shadow-2xs"
        >
          <Sparkles className="size-4 text-indigo-600 shrink-0" />
          <span className="truncate">Generate with AI</span>
        </Button>
        <Button
          variant="outline"
          className="h-11 sm:h-12 px-3 text-xs sm:text-sm font-medium border-border hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all justify-start sm:justify-center cursor-pointer shadow-2xs"
        >
          <Workflow className="size-4 text-indigo-600 shrink-0" />
          <span className="truncate">Start Automation</span>
        </Button>
      </div>
    </div>
  );
};
