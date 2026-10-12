import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import fs from "node:fs";

interface UploadVideoInput {
  filePath: string;
  userId: string;
  projectId: string;
  workflowId: string;
}

interface UploadVideoResult {
  objectKey: string;
}

function getRequiredEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured.`,
    );
  }

  return value;
}

const bucketName =
  getRequiredEnvironmentVariable(
    "B2_BUCKET_NAME",
  );

const b2Client =
  new S3Client({
    endpoint:
      getRequiredEnvironmentVariable(
        "B2_ENDPOINT",
      ),
    region:
      getRequiredEnvironmentVariable(
        "B2_REGION",
      ),
    credentials: {
      accessKeyId:
        getRequiredEnvironmentVariable(
          "B2_KEY_ID",
        ),
      secretAccessKey:
        getRequiredEnvironmentVariable(
          "B2_APPLICATION_KEY",
        ),
    },
  });

export async function uploadVideoToB2(
  input: UploadVideoInput,
): Promise<UploadVideoResult> {
  const objectKey = [
    "users",
    input.userId,
    "projects",
    input.projectId,
    "workflows",
    `${input.workflowId}.mp4`,
  ].join("/");

  const fileStream =
    fs.createReadStream(
      input.filePath,
    );

  await b2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileStream,
      ContentType: "video/mp4",
    }),
  );

  return {
    objectKey,
  };
}