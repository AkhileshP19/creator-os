"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectData } from "@/types/dashboard-types";
import { formatDistanceToNow } from "date-fns";
import { ProjectStatusBadge } from "../ui/custom/project-status-badge";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

export default function Projects({ data }: { data: ProjectData[] }) {
  const items = data || [];

  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-card shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-indigo-600" />
          <h2 className="font-semibold text-base text-foreground">
            Recent Projects
          </h2>
        </div>
        <Link
          href="/projects"
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
          No recent projects found.
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((project) => (
            <div
              key={project.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="size-9 rounded-lg shrink-0 mt-0.5">
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-lg">
                    {project?.name ? project.name.slice(0, 2).toUpperCase() : "PR"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {project?.name}
                  </span>
                  {project?.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {project.description}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {project?.type?.replaceAll("_", " ")}
                    </span>
                    {project?.status === "in_progress" && project?.progress !== undefined && (
                      <div className="w-20">
                        <Progress value={project.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-12 sm:pl-0">
                <ProjectStatusBadge status={project?.status} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {project?.updatedAt
                    ? formatDistanceToNow(new Date(project.updatedAt), {
                        addSuffix: true,
                      })
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}