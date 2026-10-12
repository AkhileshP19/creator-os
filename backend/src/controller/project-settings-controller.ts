import type { RequestHandler } from "express";

import projectSettingsService from "../services/project-settings-service.js";

export const createProjectSettingsController: RequestHandler = async (
    req,
    res,
) => {
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

        const {
            brandName,
            defaultDuration,
            defaultAspectRatio,
        } = req.body;

        if (!brandName || typeof brandName !== "string") {
            return res.status(400).json({
                status: "ERROR",
                message: "Brand name is required",
                data: null,
            });
        }

        const projectSettings =
            await projectSettingsService.createProjectSettings({
                projectId,
                currentUserId,
                brandName,
                defaultDuration,
                defaultAspectRatio,
            });

        return res.status(201).json({
            status: "SUCCESS",
            message: "Project settings created successfully",
            data: {
                responseData: projectSettings,
                totalCount: 1,
                totalPages: 1,
                currentPage: 1,
            },
        });
    } catch (error) {
        console.error("Failed to create project settings:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to create project settings",
            data: null,
        });
    }
};

export const getProjectSettingsController: RequestHandler = async (
    req,
    res,
) => {
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

        const projectSettings =
            await projectSettingsService.getProjectSettings(
                projectId,
                currentUserId,
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Project settings retrieved successfully",
            data: {
                responseData: projectSettings,
            },
        });
    } catch (error) {
        console.error("Failed to fetch project settings:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to fetch project settings",
            data: null,
        });
    }
};

export const updateProjectSettingsController: RequestHandler = async (
    req,
    res,
) => {
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

        const {
            brandName,
            defaultDuration,
            defaultAspectRatio,
        } = req.body;

        const updatedSettings =
            await projectSettingsService.updateProjectSettings(
                projectId,
                currentUserId,
                {
                    brandName,
                    defaultDuration,
                    defaultAspectRatio,
                },
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Project settings updated successfully",
            data: {
                responseData: updatedSettings,
            },
        });
    } catch (error) {
        console.error("Failed to update project settings:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update project settings",
            data: null,
        });
    }
};