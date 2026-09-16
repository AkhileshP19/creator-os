import type { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import type { JsonValue } from "@prisma/orm-postgres/target/codec-types";

export type NewContentFormValues = {
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  tags: JsonValue;
  status: "DRAFT" | "ARCHIVED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
  scheduledDate?: Temporal.Instant;
  priority: "P0" | "P1" | "P2" | "P3";
  createdById: string;
};

const contentIdeaService = {
  createContentIdea: async ({
    projectId,
    title,
    description,
    category,
    tags,
    scheduledDate,
    status,
    priority,
    createdById, // Added here so it's in scope
  }: NewContentFormValues) => {
    const newContentIdea = await db.orm.public.ContentIdea.create({
      projectId,
      title,
      // Map undefined to null if the database expects null
      description: description ?? null,
      category: category ?? null,
      tags,
      scheduledDate: scheduledDate ?? null,
      status,
      priority,
      createdById,
      deletedAt: null,
    });

    return newContentIdea;
  },
};

export default contentIdeaService;
