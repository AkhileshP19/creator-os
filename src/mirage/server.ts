import { createServer, Server } from "miragejs";
import dashboardOverviewRoutes from "./routes/dashboard/dashboard/overview";
import dashboardProjectsRoutes from "./routes/dashboard/dashboard/projects";
import dashboardAiActivityRoutes from "./routes/dashboard/dashboard/ai-activity";
import dashboardPendingReviewsRoutes from "./routes/dashboard/dashboard/pending-reviews";
import dashboardAutomationActivityRoutes from "./routes/dashboard/dashboard/automation-activity";

export function makeServer(
    { environment = "development" }: { environment?: string } = {}
): Server {
    const server = createServer({
        environment,

        models: {},

        seeds() { },

        routes() {
            this.urlPrefix = "http://localhost:8080";

            dashboardOverviewRoutes(this);
            dashboardProjectsRoutes(this);
            dashboardAiActivityRoutes(this);
            dashboardPendingReviewsRoutes(this);
            dashboardAutomationActivityRoutes(this);

            this.passthrough((request) => {
                return !request.url.startsWith("http://localhost:8080");
            });
        },
    });

    return server;
}