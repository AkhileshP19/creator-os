export interface ProjectSettings {
  id: string;
  projectId: string;
  brandName: string;
  defaultDuration: number;
  defaultAspectRatio: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettingsRequest {
  brandName: string;
  defaultDuration: number;
  defaultAspectRatio: string;
}

export interface ProjectSettingsResponse {
  status: "SUCCESS" | "ERROR";
  message: string;
  data: {
    responseData: ProjectSettings | null;
  } | null;
}