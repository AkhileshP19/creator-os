import { PendingReviewsData } from "@/types/dashboard-types"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PendingReviewsProps {
    data: PendingReviewsData[];
    totalCount: number;
}

export const PendingReviews = ({ data, totalCount }: PendingReviewsProps) => {
    console.log("total count", totalCount)
    console.log("data count", data)
    return (
        <div className="border rounded-md p-4">
            <div className="flex justify-between mb-4">
                <span className="font-semibold">Pending Reviews</span>
                <Badge>{totalCount}</Badge>
            </div>
            <div className="flex flex-col gap-2">
                {data.map((item) => {
                    return (
                        <div key={item.id} className="p-2 border rounded flex items-center justify-between text-sm">
                            <div className="flex gap-2">
                                <Avatar>
                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold rounded-md">
                                        {item?.title?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">{item.title}</span>
                                    <div className="flex gap-2">
                                        <Badge className="bg-indigo-50 text-violet-600">{item.metadata.source.replaceAll("_", " ")}</Badge>
                                        <span className="text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Badge className="bg-indigo-50 text-indigo-600">{item.status}</Badge>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}