import { mockAiActivity } from "@/mirage/mock-data/dashboard/ai-activity-data";
import { mockPendingReviews } from "@/mirage/mock-data/dashboard/pending-reviews-data";
import { ApiEndPoint } from "@/types/api/api-types";
import { Server } from "miragejs";

export default function dashboardPendingReviewsRoutes(server: Server) {
    server.get(ApiEndPoint.GET_PENDING_REVIEWS, (_schema, request) => {
        const pageNo = Number(request.queryParams.pageNo ?? 1);
        const pageSize = Number(request.queryParams.pageSize ?? 10);

        const projects = mockPendingReviews;
        const totalCount = projects.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        const currentPage = Math.min(
            Math.max(pageNo, 1),
            Math.max(totalPages, 1)
        );

        const startIndex = (currentPage - 1) * pageSize;
        const projectsToReturn = projects.slice(
            startIndex,
            startIndex + pageSize
        );
        return {
            status: "SUCCESS",
            message: "AI Activity fetched successfully",
            data: {
                responseData: projectsToReturn,
                totalCount,
                totalPages,
                currentPage,
            },
        };
    });
}