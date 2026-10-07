import { publishService } from "../services/publish-service.js";
import {
  createPublishJobSchema,
  publishIdSchema,
  publishJobQuerySchema,
  retryPublishJobSchema,
} from "../schema/validation-schemas/publish-validation.js";
import { publishingHandler } from "./publishing-response.js";
export const createPublishJob = publishingHandler(async (req, res) =>
  res
    .status(201)
    .json({
      status: "SUCCESS",
      message: "Video queued for scheduled publishing",
      data: {
        responseData: await publishService.create(
          req.currentUser.id,
          createPublishJobSchema.parse(req.body),
        ),
      },
    }),
);
export const listPublishJobs = publishingHandler(async (req, res) =>
  res.json({
    status: "SUCCESS",
    message: "Publishing jobs fetched",
    data: await publishService.list(
      req.currentUser.id,
      publishJobQuerySchema.parse(req.query),
    ),
  }),
);
export const getPublishJob = publishingHandler(async (req, res) =>
  res.json({
    status: "SUCCESS",
    message: "Publishing job fetched",
    data: {
      responseData: await publishService.get(
        req.currentUser.id,
        publishIdSchema.parse(req.params.publishJobId),
      ),
    },
  }),
);
export const retryPublishJob = publishingHandler(async (req, res) => {
  retryPublishJobSchema.parse(req.body ?? {});
  res.json({
    status: "SUCCESS",
    message: "Publishing retry queued",
    data: {
      responseData: await publishService.retry(
        req.currentUser.id,
        publishIdSchema.parse(req.params.publishJobId),
      ),
    },
  });
});
