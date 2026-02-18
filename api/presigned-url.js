import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const client = new S3Client({
  region: process.env.S3_REGION || "ru-central-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || "test-bucket";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return new Response(
      JSON.stringify({ error: "Missing 'key' query parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const Conditions = [["content-length-range", 1, MAX_SIZE]];

  try {
    const url = await createPresignedPost(client, {
      Bucket: BUCKET,
      Key: key,
      Conditions,
      Expires: 3600,
    });

    return new Response(JSON.stringify(url), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create presigned URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
