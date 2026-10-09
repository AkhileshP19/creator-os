import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import {
  startPublishWorker,
  stopPublishWorker,
} from "./services/publish-worker-service.js";

const server = createServer(app);

const port = Number(
  process.env.PORT ?? 5000,
);

const host = process.env.HOST ?? "127.0.0.1";

server.listen(
  port,
  host,
  () => {
    console.log(
      `Server is running on http://${host}:${port}`,
    );

    startPublishWorker();
  },
);

for (
  const signal of [
    "SIGINT",
    "SIGTERM",
  ] as const
) {
  process.once(
    signal,
    () => {
      server.close();

      void stopPublishWorker().finally(
        () => process.exit(0),
      );
    },
  );
}