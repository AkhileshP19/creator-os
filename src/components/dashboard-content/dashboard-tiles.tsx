import { DashboardOverviewResponse } from "@/types/dashboard-types"
import { FileChartColumn, FileCheck, FolderKanban, Send, TrendingDown, TrendingUp } from "lucide-react"

export const DashboardTiles = ({ data }: { data: DashboardOverviewResponse }) => {
    const metrics = [
        {
            key: "activeProjects",
            label: "Active Projects",
            icon: <FolderKanban strokeWidth={1.3} size={16} />,
            value: data?.metrics.activeProjects.value,
            change: data?.metrics.activeProjects.change,
            changePeriod: data?.metrics.activeProjects.changePeriod,
            trend: data?.metrics.activeProjects.trend,
        },
        {
            key: "contentCreated",
            label: "Content Created",
            icon: <FileChartColumn strokeWidth={1.3} size={16} />,
            value: data?.metrics.contentCreated.value,
            change: data?.metrics.contentCreated.change,
            changePeriod: data?.metrics.contentCreated.changePeriod,
            trend: data?.metrics.contentCreated.trend,
        },
        {
            key: "pendingReviews",
            label: "Pending Reviews",
            icon: <FileCheck strokeWidth={1.3} size={16} />,
            value: data?.metrics.pendingReviews.value,
            attentionRequired: data?.metrics.pendingReviews.attentionRequired,
        },
        {
            key: "published",
            label: "Published",
            icon: <Send strokeWidth={1.3} size={16} />,
            value: data?.metrics.published.value,
            change: data?.metrics.published.change,
            changePeriod: data?.metrics.published.changePeriod,
            trend: data?.metrics.published.trend,
        }
    ]

    return (
        <div>
            <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 w-full">
                {metrics.map((metric) => (
                    <div key={metric.key} className="p-4 border rounded-lg bg-background">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-muted-foreground text-sm font-semibold">{metric.label}</span>
                            {metric.icon}
                        </div>
                        <div className="text-2xl font-bold">
                            {metric.value}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {metric.trend === "up" ?
                                <div className="flex items-center gap-2">
                                    <TrendingUp color="green" size={12} />
                                    <span className="text-green-500"> {metric.change}</span>
                                    <span className="text-muted-foreground">{metric.changePeriod}</span>
                                </div>
                                : metric.trend === "down" ?
                                    <div className="flex items-center gap-2">
                                        <TrendingDown color="red" size={12} />
                                        <span className="text-red-500"> {metric.change}</span>
                                        <span className="text-muted-foreground">{metric.changePeriod}</span>
                                    </div>
                                    : metric.key === "pendingReviews" ?
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-xs">Needed your attention</span>
                                        </div>
                                        : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}