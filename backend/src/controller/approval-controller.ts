import type { RequestHandler } from "express";
import { ZodError } from "zod";
import approvalService from "../services/approval-service.js";
import {
  approvalQuerySchema,
  rejectionSchema,
} from "../schema/validation-schemas/approval-validation.js";
import { workflowError } from "../services/video-review-service.js";

const handle =
  (
    action: "list" | "get" | "approve" | "reject" | "regenerate",
  ): RequestHandler =>
  async (req, res) => {
    try {
      const userId = req.currentUser.id;
      if (action === "list") {
        const data = await approvalService.list(
          userId,
          approvalQuerySchema.parse(req.query),
        );
        return res.json({
          status: "SUCCESS",
          message: "Approvals fetched successfully",
          data,
        });
      }
      const id = req.params.approvalId;
      if (typeof id !== "string" || !id.trim())
        workflowError("Invalid approval ID", 400);
      const responseData =
        action === "get"
          ? await approvalService.get(id, userId)
          : action === "regenerate"
            ? await approvalService.regenerate(id, userId)
            : await approvalService.decide(
                id,
                userId,
                action === "approve" ? "APPROVED" : "REJECTED",
                action === "reject"
                  ? rejectionSchema.parse(req.body ?? {}).comments
                  : undefined,
              );
      return res.status(action === "regenerate" ? 202 : 200).json({
        status: "SUCCESS",
        message:
          action === "regenerate"
            ? "Video regeneration started"
            : action === "get"
              ? "Approval fetched successfully"
              : "Approval updated successfully",
        data: { responseData },
      });
    } catch (error: unknown) {
      const statusCode =
        error instanceof ZodError
          ? 400
          : error instanceof Error &&
              "statusCode" in error &&
              typeof error.statusCode === "number"
            ? error.statusCode
            : 500;
      if (statusCode === 500)
        console.error("Approval operation failed:", error);
      return res.status(statusCode).json({
        status: "ERROR",
        data: null,
        message:
          error instanceof ZodError
            ? "Invalid approval request"
            : statusCode !== 500 && error instanceof Error
              ? error.message
              : "Approval operation failed. Please try again.",
      });
    }
  };
export const listApprovalsController = handle("list");
export const getApprovalController = handle("get");
export const approveController = handle("approve");
export const rejectController = handle("reject");
export const regenerateController = handle("regenerate");
