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
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {metrics.map((metric) => (
                    <div key={metric.key} className="p-4 sm:p-5 border rounded-xl bg-card shadow-xs hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-muted-foreground text-xs sm:text-sm font-medium">{metric.label}</span>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-50 text-indigo-600">
                                {metric.icon}
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {metric.value ?? "0"}
                        </div>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {metric.trend === "up" ?
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="size-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">{metric.change}</span>
                                    <span className="text-muted-foreground">{metric.changePeriod}</span>
                                </div>
                                : metric.trend === "down" ?
                                    <div className="flex items-center gap-1.5">
                                        <TrendingDown className="size-3.5 text-rose-500" />
                                        <span className="text-rose-500 font-medium">{metric.change}</span>
                                        <span className="text-muted-foreground">{metric.changePeriod}</span>
                                    </div>
                                    : metric.key === "pendingReviews" ?
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground text-xs font-medium">Needs your attention</span>
                                        </div>
                                        : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}