import type { RequestHandler } from "express";
import { Temporal } from "temporal-polyfill";
import contentIdeaService from "../services/content-idea-service.js";

export const createContentIdeaController: RequestHandler = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      tags,
      scheduledDate,
      status,
      priority,
    } = req.body;
    const createdById = req.currentUser.id;

    const newContentIdea = await contentIdeaService.createContentIdea({
      projectId,
      title,
      description,
      category,
      tags,
      ...(scheduledDate
        ? { scheduledDate: Temporal.Instant.from(scheduledDate) }
        : {}),
      status,
      priority,
      createdById,
    });

    return res.status(201).json({
      status: "SUCCESS",
      message: "Content idea created successfully",
      data: {
        responseData: newContentIdea,
      },
    });
  } catch (error) {
    console.error("Failed to create content idea:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to create content idea",
      data: null,
    });
  }
};

export const getContentIdeasController: RequestHandler = async (req, res) => {
  try {
    const pageNo = req.query.pageNo as string;
    const pageSize = req.query.pageSize as string;
    const search = req.query.search as string;

    const currentUserId = req.currentUser.id;

    const contentIdeas = await contentIdeaService.getContentIdeas({
      currentUserId,
      pageNo: Number(pageNo),
      pageSize: Number(pageSize),
      search,
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Content ideas fetched successfully",
      data: {
        responseData: contentIdeas.contentIdeas,
        totalCount: contentIdeas.totalCount,
        totalPages: contentIdeas.totalPages,
        currentPage: contentIdeas.currentPage,
      },
    });
  } catch (error) {
    console.error("Failed to fetch content ideas:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch content ideas",
      data: null,
    });
  }
};

export const getContentIdeaByIdController: RequestHandler = async (
  req,
  res,
) => {
  try {
    const contentId = req.params.contentId;

    if (!contentId || Array.isArray(contentId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid content idea ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    const contentIdea = await contentIdeaService.getContentIdeaById(
      contentId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Content idea fetched successfully",
      data: {
        responseData: contentIdea,
      },
    });
  } catch (error) {
    console.error("Failed to fetch content idea by ID:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch content idea by ID",
      data: null,
    });
  }
};

export const updateContentIdeaController: RequestHandler = async (req, res) => {
  try {
    const contentId = req.params.contentId;

    if (!contentId || Array.isArray(contentId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid content ID",
        data: null,
      });
    }

    const { scheduledDate, ...restUpdateData } = req.body;
    const updateData = {
      ...restUpdateData,
      ...(scheduledDate === undefined
        ? {}
        : {
            scheduledDate:
              scheduledDate === null
                ? null
                : Temporal.Instant.from(scheduledDate),
          }),
    };
    const currentUserId = req.currentUser.id;

    const updatedContentIdea = await contentIdeaService.updateContentIdea(
      contentId,
      updateData,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Content idea updated successfully",
      data: {
        responseData: updatedContentIdea,
      },
    });
  } catch (error) {
    console.error("Failed to update content idea:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to update content idea",
      data: null,
    });
  }
};

export const deleteContentIdeaController: RequestHandler = async (req, res) => {
  try {
    const contentId = req.params.contentId;

    if (!contentId || Array.isArray(contentId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid content idea ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    const deletedContentIdea = await contentIdeaService.deleteContentIdea(
      contentId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Content idea deleted successfully",
      data: {
        responseData: deletedContentIdea,
      },
    });
  } catch (error) {
    console.error("Failed to delete content idea:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to delete content idea",
      data: null,
    });
  }
};
