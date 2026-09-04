import type { Request, Response, NextFunction } from "express";

const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  res.status(500).json({
    status: "ERROR",
    message: "Internal Server Error",
  });
};

export default errorMiddleware;
