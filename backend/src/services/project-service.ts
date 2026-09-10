import { db } from "../prisma/db.js";

interface CreateProjectInput {
  name: string;
  description: string;
  ownerId: string;
}

interface GetProjectsInput {
  currentUserId: string;
  pageNo: string;
  pageSize: string;
  search: string;
}

const projectService = {
  createProject: async ({ name, description, ownerId }: CreateProjectInput) => {
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
    currentUserId,
    pageNo,
    pageSize,
    search,
  }: GetProjectsInput) => {
    try {
      let query = db.orm.public.Project.where({
        ownerId: currentUserId,
        deletedAt: null,
      }).orderBy((p) => p.createdAt.desc());

      if (search) {
        query = query.where((p) => p.name.ilike(`%${search}%`));
      }

      if (pageNo && pageSize) {
        const offset = (Number(pageNo) - 1) * Number(pageSize);
        query = query.offset(offset).limit(Number(pageSize));
      }

      const projects = await query.all();
      return projects;
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw error;
    }
  },

  getProjectById: async (projectId: string) => {
    try {
      const project = await db.orm.public.Project.where({
        id: projectId,
      }).first();
      return project;
    } catch (error) {
      console.error("Failed to get project by ID:", error);
      throw error;
    }
  },

  deleteProjectById: async (projectId: string) => {
    try {
      const deletedProject = await db.orm.public.Project.where({
        id: projectId,
      }).update({ deletedAt: Temporal.Now.instant() });
      return deletedProject;
    } catch (error) {
      console.error("Failed to delete project by ID:", error);
      throw error;
    }
  },

  updateProjectById: async (projectId: string, updateData: Partial<CreateProjectInput>) => {
    try {
      const updatedProject = await db.orm.public.Project.where({
        id: projectId,
      }).update(updateData);
      return updatedProject;
    } catch (error) {
      console.error("Failed to update project by ID:", error);
      throw error;
    }
  }
};

export default projectService;
