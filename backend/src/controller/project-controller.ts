import type { RequestHandler } from "express";

import projectService from "../services/project-service.js";

export const projectController: RequestHandler = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.currentUser.id;

    const newProject = await projectService.createProject({
      name,
      description,
      ownerId,
    });

    return res.status(201).json({
      status: "SUCCESS",
      message: "Project created successfully",
      data: {
        responseData: newProject,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
      },
    });
  } catch (error) {
    console.error("Failed to create project:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Failed to create project",
      data: null,
    });
  }
};

export const getProjectsController: RequestHandler = async (req, res) => {
  try {
    // Extract the user ID attached by your authentication middleware
    const pageNo = req.query.pageNo as string;
    const pageSize = req.query.pageSize as string;
    const search = req.query.search as string;

    const currentUserId = req.currentUser.id;

    // Fetch user projects from the service layer
    const projects = await projectService.getProjects({
      currentUserId,
      pageNo: Number(pageNo),
      pageSize: Number(pageSize),
      search,
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Projects retrieved successfully",
      data: {
        responseData: projects.projects,
        totalCount: projects.totalCount,
        totalPages: projects.totalPages,
        currentPage: projects.currentPage,
      },
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch projects",
      data: null,
    });
  }
};

export const getProjectByIdController: RequestHandler = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid project ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    // Fetch the project by ID from the service layer
    const project = await projectService.getProjectById(
      projectId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Project retrieved successfully",
      data: {
        responseData: project,
      },
    });
  } catch (error) {
    console.error("Failed to fetch project by ID:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch project by ID",
      data: null,
    });
  }
};

export const deleteProjectByIdController: RequestHandler = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid project ID",
        data: null,
      });
    }

    const currentUserId = req.currentUser.id;

    // Delete the project by ID from the service layer
    const deletedProject = await projectService.deleteProjectById(
      projectId,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Project deleted successfully",
      data: {
        responseData: deletedProject,
      },
    });
  } catch (error) {
    console.error("Failed to delete project by ID:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to delete project by ID",
      data: null,
    });
  }
};

export const updateProjectByIdController: RequestHandler = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid project ID",
        data: null,
      });
    }

    const updateData = req.body;
    const currentUserId = req.currentUser.id;

    // Update the project by ID from the service layer
    const updatedProject = await projectService.updateProjectById(
      projectId,
      updateData,
      currentUserId,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Project updated successfully",
      data: {
        responseData: updatedProject,
      },
    });
  } catch (error) {
    console.error("Failed to update project by ID:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to update project by ID",
      data: null,
    });
  }
};
