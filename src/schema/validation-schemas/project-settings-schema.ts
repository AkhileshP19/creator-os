import * as z from "zod";

export const projectSettingsFormSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(1, { message: "Brand name is required" }),

  defaultDuration: z
    .number()
    .min(1, { message: "Duration must be at least 1 second" })
    .max(300, { message: "Duration cannot exceed 300 seconds" }),

  defaultAspectRatio: z
    .string()
    .min(1, { message: "Aspect ratio is required" }),
});