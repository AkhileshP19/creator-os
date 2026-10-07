import { db } from "../prisma/db.js";

export type ContentIdeaStatus =
  | "DRAFT"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED";

export async function updateContentStatus(
  contentId: string,
  status: ContentIdeaStatus,
) {
  return db.orm.public.ContentIdea.where({
    id: contentId,
    deletedAt: null,
  }).update({
    status,
  });
}