import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
