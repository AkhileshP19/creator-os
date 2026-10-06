import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

export async function getB2ObjectStream(objectKey: string, offset = 0) {
  if (!s3Client || !bucketName) throw new Error("B2 is not configured");
  if (!objectKey || /^https?:/i.test(objectKey))
    throw new Error("Invalid B2 object key");
  const object = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ...(offset ? { Range: `bytes=${offset}-` } : {}),
    }),
    { abortSignal: AbortSignal.timeout(600_000) },
  );
  if (
    !(object.Body instanceof Readable) ||
    !object.ContentLength ||
    object.ContentLength <= 0
  ) {
    if (object.Body instanceof Readable) object.Body.destroy();
    throw new Error("B2 did not return a readable video");
  }
  // The paused stream can fail while the upload session is being initialized.
  // Keep that from becoming an uncaught EventEmitter error; the upload checks it.
  object.Body.on("error", () => {});
  return { stream: object.Body, size: object.ContentLength };
}

export const b2PublishingStorage = { getObjectStream: getB2ObjectStream };

const bucketName = process.env.B2_BUCKET_NAME;
const endpoint = process.env.B2_ENDPOINT;
const region = process.env.B2_REGION;
const accessKeyId = process.env.B2_KEY_ID;
const secretAccessKey = process.env.B2_APPLICATION_KEY;

let s3Client: S3Client | null = null;

if (endpoint && accessKeyId && secretAccessKey) {
  s3Client = new S3Client({
    endpoint,
    region: region || "us-east-005",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function getB2SignedUrl(
  objectKey: string,
  expiresInSeconds: number = 86400,
): Promise<string> {
  if (!objectKey) return "";
  if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
    return objectKey;
  }

  if (!s3Client || !bucketName) {
    console.warn(
      "B2 S3 client credentials not configured properly in backend, returning objectKey",
    );
    return objectKey;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    console.error("Failed to generate B2 signed URL:", error);
    return objectKey;
  }
}
