import { type Application } from "express";
import cors from "cors";
import express from "express";
import healthRouter from "./routes/health.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/not-found-middleware.js"


const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api/health", healthRouter);

app.use(notFoundMiddleware);

app.use(errorMiddleware)

export default app;