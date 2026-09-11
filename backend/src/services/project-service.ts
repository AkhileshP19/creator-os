import { db } from "../prisma/db.js";

interface CreateProjectInput {
  name: string;
  description: string;
  ownerId: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
}

interface GetProjectsInput {
  currentUserId: string;
  pageNo: number;
  pageSize: number;
  search?: string;
}

interface GetProjectsResult {
  projects: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const projectService = {
  createProject: async ({ name, description, ownerId }: CreateProjectInput) => {
    try {
      const newProject = await db.orm.public.Project.create({
        name,
        description,
        ownerId,
        deletedAt: null,
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
  }: GetProjectsInput): Promise<GetProjectsResult> => {
    try {
      let query = db.orm.public.Project.where({
        ownerId: currentUserId,
        deletedAt: null,
      });

      if (search) {
        query = query.where((p) => p.name.ilike(`%${search}%`));
      }

      // Use aggregate() for counting, NOT query.count()
      const countResult = await query.aggregate((a) => ({ total: a.count() }));
      const totalCount = Number(countResult.total);

      const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

      const offset = (pageNo - 1) * pageSize;

      const projects = await query
        .orderBy((p) => p.createdAt.desc())
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        projects,
        totalCount,
        totalPages,
        currentPage: pageNo,
      };
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw error;
    }
  },

  getProjectById: async (projectId: string, currentUserId: string) => {
    try {
      const project = await db.orm.public.Project.where({
        id: projectId,
        ownerId: currentUserId,
        deletedAt: null,
      }).first();
      return project;
    } catch (error) {
      console.error("Failed to get project by ID:", error);
      throw error;
    }
  },

  deleteProjectById: async (projectId: string, currentUserId: string) => {
    try {
      const deletedProject = await db.orm.public.Project.where({
        id: projectId,
        ownerId: currentUserId,
        deletedAt: null,
      }).update({ deletedAt: Temporal.Now.instant() });
      return deletedProject;
    } catch (error) {
      console.error("Failed to delete project by ID:", error);
      throw error;
    }
  },

  updateProjectById: async (
    projectId: string,
    updateData: UpdateProjectInput,
    currentUserId: string,
  ) => {
    try {
      const updatedProject = await db.orm.public.Project.where({
        id: projectId,
        ownerId: currentUserId,
        deletedAt: null,
      }).update(updateData);
      return updatedProject;
    } catch (error) {
      console.error("Failed to update project by ID:", error);
      throw error;
    }
  },
};

export default projectService;
