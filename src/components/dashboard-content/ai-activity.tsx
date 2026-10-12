import { AIActivityData } from "@/types/dashboard-types";
import { Badge } from "../ui/badge";
import { CircleCheck, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AIActivityProps {
  data: AIActivityData[];
}

export const AIActivity = ({ data }: AIActivityProps) => {
  const items = data || [];

  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-card shadow-xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-600" />
          <h2 className="font-semibold text-base text-foreground">AI Activity</h2>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 font-medium text-xs flex items-center gap-1.5"
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-sm text-muted-foreground">
          No recent AI activity.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 text-sm">
              <div className="flex items-center justify-center size-7 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                <CircleCheck className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-foreground font-medium truncate">
                  {item?.title}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {item?.description}
                </span>
                <span className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {item?.createdAt
                    ? formatDistanceToNow(new Date(item.createdAt), {
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
};