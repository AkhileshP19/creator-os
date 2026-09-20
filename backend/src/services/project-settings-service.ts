import { db } from "../prisma/db.js";

interface CreateProjectSettingsInput {
    projectId: string;
    currentUserId: string;
    brandName: string;
    defaultDuration?: number;
    defaultAspectRatio?: string;
}

interface UpdateProjectSettingsInput {
    brandName?: string;
    defaultDuration?: number;
    defaultAspectRatio?: string;
}

const projectSettingsService = {
    createProjectSettings: async ({
        projectId,
        currentUserId,
        brandName,
        defaultDuration = 10,
        defaultAspectRatio = "9:16",
    }: CreateProjectSettingsInput) => {
        const project = await db.orm.public.Project.where({
            id: projectId,
            ownerId: currentUserId,
            deletedAt: null,
        }).first();

        if (!project) {
            const error = new Error(
                "Project not found or you do not have access to it",
            );
            Object.assign(error, { statusCode: 404 });
            throw error;
        }

        const existingSettings = await db.orm.public.ProjectSettings.where({
            projectId,
        }).first();

        if (existingSettings) {
            const error = new Error(
                "Project settings already exist for this project",
            );
            Object.assign(error, { statusCode: 409 });
            throw error;
        }

        const projectSettings = await db.orm.public.ProjectSettings.create({
            projectId,
            brandName,
            defaultDuration,
            defaultAspectRatio,
        });

        return projectSettings;
    },

    getProjectSettings: async (
        projectId: string,
        currentUserId: string,
    ) => {
        const project = await db.orm.public.Project.where({
            id: projectId,
            ownerId: currentUserId,
            deletedAt: null,
        }).first();

        if (!project) {
            const error = new Error(
                "Project not found or you do not have access to it",
            );
            Object.assign(error, { statusCode: 404 });
            throw error;
        }

        const projectSettings = await db.orm.public.ProjectSettings.where({
            projectId,
        }).first();

        if (!projectSettings) {
            const error = new Error("Project settings not found");
            Object.assign(error, { statusCode: 404 });
            throw error;
        }

        return projectSettings;
    },

    updateProjectSettings: async (
        projectId: string,
        currentUserId: string,
        updateData: UpdateProjectSettingsInput,
    ) => {
        const project = await db.orm.public.Project.where({
            id: projectId,
            ownerId: currentUserId,
            deletedAt: null,
        }).first();

        if (!project) {
            const error = new Error(
                "Project not found or you do not have access to it",
            );
            Object.assign(error, { statusCode: 404 });
            throw error;
        }

        const existingSettings = await db.orm.public.ProjectSettings.where({
            projectId,
        }).first();

        if (!existingSettings) {
            const error = new Error("Project settings not found");
            Object.assign(error, { statusCode: 404 });
            throw error;
        }

        const updatedSettings = await db.orm.public.ProjectSettings.where({
            projectId,
        }).update(updateData);

        return updatedSettings;
    },
};

export default projectSettingsService;