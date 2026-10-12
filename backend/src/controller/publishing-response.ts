import type { Request, Response, RequestHandler } from "express";
import { ZodError } from "zod";
export function publishingHandler(
  action: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return async (req, res) => {
    try {
      await action(req, res);
    } catch (error: unknown) {
      const status =
        error instanceof ZodError
          ? 400
          : error instanceof Error &&
              "statusCode" in error &&
              typeof error.statusCode === "number"
            ? error.statusCode
            : 500;
      res
        .status(status)
        .json({
          status: "ERROR",
          data: null,
          message:
            status === 400
              ? "Invalid publishing request"
              : status !== 500 && error instanceof Error
                ? error.message
                : error instanceof Error && error.message.startsWith("Configure ")
                  ? error.message
                  : "Publishing operation failed. Check configuration and try again.",
        });
    }
  };
}
