"use client"

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { format, getHours } from "date-fns";
import { Lightbulb, Plus, Sparkle, Sparkles, Workflow } from "lucide-react";

export const DashboardHeader = () => {
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
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-4xl">
            Good {time}, {user.user?.firstName}
          </h1>
          <span className="text-gray-500 text-muted-foreground">
            Here's what's happening across your CreatorOS workspace.
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 border py-5 px-4 text-sm cursor-pointer"
          >
            <Sparkles stroke="#4f46e5" />
            Generate Content
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 border py-5 px-4 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white cursor-pointer"
          >
            <Plus />
            Create Project
          </Button>
        </div>

      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 border py-5 px-4 text-sm cursor-pointer"
        >
          <Plus stroke="#4f46e5" />
          Create Project
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 border py-5 px-4 text-sm cursor-pointer"
        >
          <Lightbulb stroke="#4f46e5" />
          Add Idea
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 border py-5 px-4 text-sm cursor-pointer"
        >
          <Sparkles stroke="#4f46e5" />
          Generate with AI
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 border py-5 px-4 text-sm cursor-pointer"
        >
          <Workflow stroke="#4f46e5" />
          Start Automation
        </Button>
      </div>
    </div>
  );
};
