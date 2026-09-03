import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";

const server = createServer(app);

server.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
});