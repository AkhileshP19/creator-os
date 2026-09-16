import type { RequestHandler } from "express";
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
      scheduledDate,
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
