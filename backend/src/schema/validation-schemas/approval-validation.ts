import { z } from "zod";

export const approvalQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(6),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).default("ALL"),
  search: z.string().trim().max(200).default(""),
  projectId: z.string().max(100).default(""),
  scheduledDateFilter: z
    .enum(["ALL", "TODAY", "NEXT_7_DAYS", "UNSCHEDULED"])
    .default("ALL"),
  sortBy: z.enum(["scheduledDate", "generatedAt"]).default("scheduledDate"),
  sortOrder: z.enum(["ASC", "DESC"]).default("ASC"),
  timezone: z
    .string()
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Invalid timezone")
    .default("UTC"),
});
export const rejectionSchema = z.object({
  comments: z.string().trim().max(2000).optional(),
});
export type ApprovalFilters = z.infer<typeof approvalQuerySchema>;
