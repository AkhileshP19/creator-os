import * as z from "zod";

export const newContentFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().min(1, { message: "Status is required" }),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  priority: z.string().min(1, { message: "Priority is required" }),
});
