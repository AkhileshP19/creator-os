import { createServer, Server } from "miragejs";
import dashboardOverviewRoutes from "./routes/dashboard/dashboard/overview";
import dashboardProjectsRoutes from "./routes/dashboard/dashboard/projects";

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

            this.passthrough((request) => {
                return !request.url.startsWith("http://localhost:8080");
            });
        },
    });

    return server;
}