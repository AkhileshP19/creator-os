import { Badge } from "@/components/ui/badge";

type ProjectStatusBadgeProps = {
    status: string;
};

export const ProjectStatusBadge = ({ status }: ProjectStatusBadgeProps) => {
    switch (status.toLowerCase()) {
        case "draft": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#f1f5f9] text-[#64748b] border-2 border-[#e2e8f0] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#64748b] rounded-full mr-2" />
                    Draft
                </Badge>
            );
        }

        case "planning": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#eff6ff] text-[#2563eb] border-2 border-[#dbeafe] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#2563eb] rounded-full mr-2" />
                    Planning
                </Badge>
            );
        }

        case "in_progress": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#eef2ff] text-[#4f46e5] border-2 border-[#e0e7ff] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#4f46e5] rounded-full mr-2" />
                    In Progress
                </Badge>
            );
        }

        case "review": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#fffbeb] text-[#d97706] border-2 border-[#fef3c7] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#d97706] rounded-full mr-2" />
                    Review
                </Badge>
            );
        }

        case "ready": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#f0fdf4] text-[#16a34a] border-2 border-[#dcfce7] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#16a34a] rounded-full mr-2" />
                    Ready
                </Badge>
            );
        }

        case "published": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#ecfdf5] text-[#059669] border-[#d1fae5] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#059669] rounded-full mr-2" />
                    Published
                </Badge>
            );
        }

        case "archived": {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#f8fafc] text-[#475569] border-2 border-[#e2e8f0] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#475569] rounded-full mr-2" />
                    Archived
                </Badge>
            );
        }

        default: {
            return (
                <Badge
                    variant="outline"
                    className="bg-[#f8fafc] text-[#64748b] border-2 border-[#e2e8f0] rounded-md"
                >
                    <span className="h-2 w-2 bg-[#64748b] rounded-full mr-2" />
                    {status}
                </Badge>
            );
        }
    }
};
