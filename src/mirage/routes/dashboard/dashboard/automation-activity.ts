import { mockAutomationActivityData } from "@/mirage/mock-data/dashboard/automation-data";
import { ApiEndPoint } from "@/types/api/api-types";
import { Server } from "miragejs";

export default function dashboardAutomationActivityRoutes(server: Server) {
    server.get(ApiEndPoint.GET_AUTOMATION_ACTIVITY, (_schema, request) => {
        const pageNo = Number(request.queryParams.pageNo ?? 1);
        const pageSize = Number(request.queryParams.pageSize ?? 10);

        const automations = mockAutomationActivityData;
        const totalCount = automations.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        const currentPage = Math.min(
            Math.max(pageNo, 1),
            Math.max(totalPages, 1)
        );

        const startIndex = (currentPage - 1) * pageSize;
        const automationDataToReturn = automations.slice(
            startIndex,
            startIndex + pageSize
        );
        return {
            status: "SUCCESS",
            message: "Automation activity data fetched successfully",
            data: {
                responseData: automationDataToReturn,
                totalCount,
                totalPages,
                currentPage,
            },
        };
    });
}