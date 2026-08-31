"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectData } from "@/types/dashboard-types";
import { formatDistanceToNow } from "date-fns";
import { ProjectStatusBadge } from "../ui/custom/project-status-badge";

export default function Projects({ data }: { data: ProjectData[] }) {
    console.log('project', data)
    return (
        <div className="border rounded-md p-4">
            <div className="flex justify-between mb-2">
                <span className="font-semibold">Recent Projects</span>
                <Button>view all</Button>
            </div>
            {data.map((data) => (
                <div key={data.id} className="flex justify-between space-y-6">
                    <div className="flex gap-4">
                        <div>
                            <Avatar>
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold rounded-md">{data?.name[0].toUpperCase() + data?.name[1].toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">{data?.name}</span>
                            <span className="text-sm text-muted-foreground">{data?.type.replaceAll("_", " ")}</span>
                            {data?.status === "in_progress" && <span><Progress value={data?.progress} className="h-4 " /></span>}

                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-6">
                        <span><ProjectStatusBadge status={data?.status} /></span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(data?.updatedAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}