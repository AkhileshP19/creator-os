import { db } from "../prisma/db.js";

interface CreateProjectInput {
    name: string;
    description: string;
    ownerId: string;
}

const projectService = {
    createProject: async ({
        name,
        description,
        ownerId,
    }: CreateProjectInput) => {
        try {
            const newProject = await db.orm.public.Project.create({
                name,
                description,
                ownerId,
            });

            return newProject;
        } catch (error) {
            console.error("Failed to create project:", error);
            throw error;
        }
    },

    getProjects: async ({
        currentUserId
    }: {
        currentUserId: string;
    }) => {
        try {
            const projects = await db.orm.public.Project.where({ ownerId: currentUserId }).all();
            return projects;
        } catch (error) {
            console.error("Failed to get projects:", error);
            throw error;
        }
    },
};

export default projectService;