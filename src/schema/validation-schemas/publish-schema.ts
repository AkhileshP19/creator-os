import { z } from "zod";
import { calculateTagsLength } from "./new-content-schema";

export const publishFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(100)
    .regex(/^[^<>]+$/, "Title cannot contain angle brackets"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .refine(
      (v) => new TextEncoder().encode(v).length <= 5000,
      "Description must be at most 5,000 UTF-8 bytes",
    ),
  tags: z
    .array(z.string())
    .default([])
    .refine(
      (tags) => calculateTagsLength(tags ?? []) <= 500,
      "Tags exceed YouTube's 500 character limit",
    )
    .refine(
      (tags) => (tags ?? []).every((tag) => !/[<>]/.test(tag)),
      "Tags cannot contain angle brackets (< or >)",
    ),
  scheduledDate: z.string().refine((value) => {
    const scheduled = new Date(value);
    const now = new Date();

    if (Number.isNaN(scheduled.getTime())) {
      return false;
    }

    // Today is perfectly valid — only reject timestamps
    // that are now or in the past.
    return scheduled.getTime() > now.getTime();
  }, "Schedule time must be later than the current time"),

  selfDeclaredMadeForKids: z.enum(["yes", "no"], {
    error: "Choose the audience",
  }),
  containsSyntheticMedia: z.enum(["yes", "no"], {
    error: "Choose a synthetic media declaration",
  }),
});

export function normalizeTags(value: string | string[]): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];
  return [
    ...new Set(
      list
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

export type PublishForm = z.infer<typeof publishFormSchema>;

