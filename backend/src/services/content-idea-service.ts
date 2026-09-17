import { Temporal } from "temporal-polyfill";
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

interface GetContentIdeasInput {
  currentUserId: string;
  pageNo: number;
  pageSize: number;
  search?: string;
}

interface GetContentIdeasResult {
  contentIdeas: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export type IdeaStatus =
  "DRAFT" | "ARCHIVED" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type PriorityLevel = "P0" | "P1" | "P2" | "P3";

export interface ContentIdeaInput {
  projectId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags: JsonValue;
  status: IdeaStatus;
  scheduledDate?: Temporal.Instant | null;
  priority: PriorityLevel;
  createdById: string;
  deletedAt?: Temporal.Instant | null;
}

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

  getContentIdeas: async ({
    currentUserId,
    pageNo,
    pageSize,
    search,
  }: GetContentIdeasInput): Promise<GetContentIdeasResult> => {
    try {
      let query = db.orm.public.ContentIdea.where({
        createdById: currentUserId,
        deletedAt: null,
      });

      if (search) {
        query = query.where((p) => p.title.ilike(`%${search}%`));
      }

      // Use aggregate() for counting, NOT query.count()
      const countResult = await query.aggregate((a) => ({ total: a.count() }));
      const totalCount = Number(countResult.total);

      const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

      const offset = (pageNo - 1) * pageSize;

      const contentIdeas = await query
        .orderBy((p) => p.createdAt.desc())
        .limit(pageSize)
        .offset(offset)
        .all();

      return {
        contentIdeas,
        totalCount,
        totalPages,
        currentPage: pageNo,
      };
    } catch (error) {
      console.error("Failed to get content ideas:", error);
      throw error;
    }
  },

  getContentIdeaById: async (contentId: string, currentUserId: string) => {
    try {
      const contentIdea = await db.orm.public.ContentIdea.where({
        id: contentId,
        createdById: currentUserId,
        deletedAt: null,
      }).first();
      return contentIdea;
    } catch (error) {
      console.error("Failed to get content idea by ID:", error);
      throw error;
    }
  },

  updateContentIdea: async (
    contentId: string,
    updateData: ContentIdeaInput,
    currentUserId: string,
  ) => {
    try {
      const updatedContentIdea = await db.orm.public.ContentIdea.where({
        id: contentId,
        createdById: currentUserId,
        deletedAt: null,
      }).update(updateData);
      return updatedContentIdea;
    } catch (error) {
      console.error("Failed to update content idea:", error);
      throw error;
    }
  },

  deleteContentIdea: async (contentId: string, currentUserId: string) => {
    try {
      const deletedContentIdea = await db.orm.public.ContentIdea.where({
        id: contentId,
        createdById: currentUserId,
        deletedAt: null,
      }).update({ deletedAt: Temporal.Now.instant() });
      return deletedContentIdea;
    } catch (error) {
      console.error("Failed to delete content idea:", error);
      throw error;
    }
  },
};

export default contentIdeaService;
