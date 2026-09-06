import { Router, type Request, type Response } from "express";

const healthRouter: Router = Router();

healthRouter.get("/", (req: Request, res: Response) => {
    res.status(200).json({             
        status: "SUCCESS",
        message: "Creator OS backend is up & running", });
});

export default healthRouter;