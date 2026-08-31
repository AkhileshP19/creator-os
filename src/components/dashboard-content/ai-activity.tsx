import { AIActivityData } from "@/types/dashboard-types";
import { Badge } from "../ui/badge";
import { CircleCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AIActivityProps {
    data: AIActivityData[];
}

export const AIActivity = ({ data }: AIActivityProps) => {
    return (
        <div className="border rounded-md p-4">
            <div className="flex justify-between mb-4">
                <span className="font-semibold">AI Activity</span>
                <Badge>Live</Badge>
            </div>
            <div className="flex flex-col gap-6">
                {data.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm gap-2">
                        <CircleCheck className="bg-indigo-50 text-indigo-600 rounded-full mt-0.5" strokeWidth={1.2} />
                        <div className="flex flex-col gap-1">
                            <span className="text-foreground font-semibold">{item?.title}</span>
                            <span className="text-muted-foreground">{item?.description}</span>
                            <span className="text-muted-foreground">{formatDistanceToNow(new Date(item?.createdAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};