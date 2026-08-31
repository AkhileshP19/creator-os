import { AutomationActivityData } from "@/types/dashboard-types"
import { Button } from "../ui/button"
import { Activity } from "lucide-react"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"

interface AutomationActivityProps {
    data: AutomationActivityData[]
}

export const AutomationActivity = ({ data }: AutomationActivityProps) => {
    return (
        <div className="border rounded-md p-4">
            <div className="flex justify-between mb-2">
                <span className="font-semibold">Automation Activity</span>
                <Button variant="outline">View all</Button>
            </div>
            <div className="space-y-4">
                {data.map((item) => {
                    return (
                        <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="bg-indigo-50 text-indigo-600 rounded p-1" strokeWidth={1.2} />
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-foreground font-semibold text-sm">{item.name}</h1>
                                    <Progress value={item.progress} className="w-[200px]" />
                                </div>
                            </div>
                            <div>
                                <Badge variant="outline">
                                    {item.status.replaceAll("_", " ")}
                                </Badge>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}