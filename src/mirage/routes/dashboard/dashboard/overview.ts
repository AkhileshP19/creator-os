import { ApiEndPoint } from "@/types/api/api-types";
import { Server } from "miragejs";

export default function dashboardOverviewRoutes(server: Server) {
    server.get(ApiEndPoint.GET_DASHBOARD_OVERVIEW, () => {
        return {
            status: "SUCCESS",
            message: "Dashboard overview fetched successfully",
            data: {
                responseData: {
                    "user": {
                        "id": "user_123",
                        "name": "Akhilesh",
                        "role": "creator"
                    },
                    "metrics": {
                        "activeProjects": {
                            "value": 12,
                            "change": 8.4,
                            "changePeriod": "last_month",
                            "trend": "up"
                        },
                        "contentCreated": {
                            "value": 148,
                            "change": 18.2,
                            "changePeriod": "this_month",
                            "trend": "up"
                        },
                        "pendingReviews": {
                            "value": 7,
                            "attentionRequired": true
                        },
                        "published": {
                            "value": 86,
                            "change": 12.5,
                            "changePeriod": "this_month",
                            "trend": "up"
                        }
                    }
                }
            }
        };
    });
}