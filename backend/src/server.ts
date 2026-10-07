import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { startPublishWorker, stopPublishWorker } from "./services/publish-worker-service.js";

const server = createServer(app);

server.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
    startPublishWorker();
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close();
    void stopPublishWorker().finally(() => process.exit(0));
  });
}
