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
        const currentUserId = req.currentUser.id;

        // Fetch user projects from the service layer
        const projects = await projectService.getProjects({ currentUserId });

        return res.status(200).json({
            status: "SUCCESS",
            message: "Projects retrieved successfully",
            data: {
                responseData: projects,
                totalCount: projects.length,
                totalPages: 1, // Add pagination math here later if needed
                currentPage: 1,
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