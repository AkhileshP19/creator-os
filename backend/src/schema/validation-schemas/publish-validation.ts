import { z } from "zod";
export const createPublishJobSchema = z
  .object({
    contentId: z.string().min(1),
    assetId: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[^<>]+$/),
    description: z
      .string()
      .max(5000)
      .refine((v) => Buffer.byteLength(v, "utf8") <= 5000)
      .optional(),
    tags: z
      .array(z.string().trim().min(1).max(100))
      .max(100)
      .refine(
        (tags) =>
          tags.reduce(
            (sum, tag) => sum + tag.length + (tag.includes(" ") ? 2 : 0),
            Math.max(0, tags.length - 1),
          ) <= 500,
      ),
    selfDeclaredMadeForKids: z.boolean(),
    containsSyntheticMedia: z.boolean(),
  })
  .strict();
export const publishJobQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["ALL", "QUEUED", "UPLOADING", "SCHEDULED", "PUBLISHED", "FAILED"])
    .default("ALL"),
  contentId: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
});
export const publishIdSchema = z.string().min(1).max(200);
export const retryPublishJobSchema = z.object({}).strict();
export const oauthCallbackSchema = z.object({
  state: z.string().min(1).max(4096),
  code: z.string().min(1).max(4096),
});
export type CreatePublishJob = z.infer<typeof createPublishJobSchema>;
export type PublishJobQuery = z.infer<typeof publishJobQuerySchema>;
