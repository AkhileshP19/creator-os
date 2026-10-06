import * as z from "zod";

export function calculateTagsLength(tags: string[]): number {
  const normalized = [
    ...new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ];
  if (normalized.length === 0) return 0;
  return normalized.reduce(
    (sum, tag) => sum + tag.length + (tag.includes(" ") ? 2 : 0),
    normalized.length - 1,
  );
}

export const createNewContentSchema = (originalScheduledDate?: Date | null) =>
  z
    .object({
      projectId: z.string().min(1, "Project is required"),
      title: z
        .string()
        .trim()
        .min(1, { message: "Title is required" })
        .max(100, { message: "Title must be at most 100 characters" })
        .regex(/^[^<>]+$/, {
          message: "Title cannot contain angle brackets (< or >)",
        }),
      description: z
        .string()
        .trim()
        .min(1, { message: "Description is required" })
        .refine(
          (v) => new TextEncoder().encode(v).length <= 5000,
          "Description must be at most 5,000 UTF-8 bytes",
        ),
      category: z.string().optional(),
      tags: z
        .array(z.string())
        .optional()
        .default([])
        .refine(
          (tags) => calculateTagsLength(tags ?? []) <= 500,
          "Tags exceed YouTube's 500 character limit",
        )
        .refine(
          (tags) => (tags ?? []).every((tag) => !/[<>]/.test(tag)),
          "Tags cannot contain angle brackets (< or >)",
        ),
      scheduledDate: z
        .custom<Date | undefined | null>()
        .refine(
          (val): val is Date => val instanceof Date && !Number.isNaN(val.getTime()),
          "Scheduled date is required",
        ),
      scheduledTime: z.string().trim().min(1, "Scheduled time is required"),
      priority: z.string().min(1, { message: "Priority is required" }),
    })
    .superRefine((data, ctx) => {
      if (!data.scheduledDate || !data.scheduledTime || !data.scheduledTime.trim()) {
        return;
      }

      const [hours, minutes] = data.scheduledTime.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid scheduled time format",
          path: ["scheduledTime"],
        });
        return;
      }

      const scheduled = new Date(data.scheduledDate);
      scheduled.setHours(hours, minutes, 0, 0);

      if (Number.isNaN(scheduled.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid scheduled date",
          path: ["scheduledDate"],
        });
        return;
      }

      if (
        originalScheduledDate &&
        !Number.isNaN(originalScheduledDate.getTime())
      ) {
        const origTime = new Date(originalScheduledDate);
        origTime.setSeconds(0, 0);
        if (scheduled.getTime() === origTime.getTime()) {
          // Unchanged from original edit value — preserve it!
          return;
        }
      }

      if (scheduled.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule time must be later than the current time",
          path: ["scheduledDate"],
        });
      }
    });

export const newContentFormSchema = createNewContentSchema();
