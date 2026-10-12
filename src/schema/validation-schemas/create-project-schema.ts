import * as z from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Project name is required" })
    .max(100, { message: "Project name cannot exceed 100 characters" }),

  description: z
    .string()
    .trim()
    .min(1, { message: "Project description is required" })
    .max(500, { message: "Project description cannot exceed 500 characters" }),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
