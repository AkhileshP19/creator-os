export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface Project {
  createdAt: string;
  deletedAt: string | null;
  description: string;
  id: string;
  name: string;
  ownerId: string;
  status: string;
  updatedAt: string;
}

export interface CreateProjectResponse {
  status: "SUCCESS" | "ERROR";
  message: string;
  data: {
    responseData: Project;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

