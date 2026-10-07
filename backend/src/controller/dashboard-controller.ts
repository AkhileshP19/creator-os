import type { RequestHandler } from "express";
import dashboardService from "../services/dashboard-service.js";

export const getDashboardOverviewController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = req.currentUser.id;
    const overview = await dashboardService.getOverview(userId);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Dashboard overview fetched successfully",
      data: {
        responseData: overview,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard overview:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch dashboard overview",
      data: null,
    });
  }
};

export const getPendingReviewsController: RequestHandler = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const pageNo = Math.max(1, Number(req.query.pageNo) || 1);
    const pageSize = Math.max(1, Number(req.query.pageSize) || 5);
    const search =
      typeof req.query.search === "string" && req.query.search.trim().length > 0
        ? req.query.search.trim()
        : undefined;

    const result = await dashboardService.getPendingReviews(
      userId,
      pageNo,
      pageSize,
      search,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Pending reviews fetched successfully",
      data: {
        responseData: result.responseData,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      },
    });
  } catch (error) {
    console.error("Failed to fetch pending reviews:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch pending reviews",
      data: null,
    });
  }
};
