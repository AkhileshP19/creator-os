"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProjectsItems {
    id: string,
    name: string,
    type: string,
    status: string,
    progress: number,
    thumbnailUrl: string,
    updatedAt: string
}


export default function Projects({ data }: { data: ProjectsItems[] }) {
    console.log('project', data)
    return (
        <div>
            <div className="flex justify-between">
                <span>recent projects</span>
                <Button>view all</Button>
            </div>
            {data.map((data) => (
                <div key={data.id} className="flex justify-between">
                    <div className="flex gap-4">
                        <div>
                            <Avatar>
                                <AvatarFallback>{data?.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base">{data?.name}</span>
                            <span className="text-base">{data?.type}</span>
                            <span className="text-base">{data?.progress}</span>

                        </div>
                    </div>
                    <div className="flex gap-6">
                        <span>{data?.status}</span>
                        <span>{data?.updatedAt}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}