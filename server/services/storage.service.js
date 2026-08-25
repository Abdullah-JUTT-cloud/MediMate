import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId || "",
      secretAccessKey: secretAccessKey || "",
    },
  });
};

const getBucketName = () => process.env.R2_BUCKET_NAME || "medalerto-assets";

const getPublicDomain = () => {
  const domain = process.env.R2_PUBLIC_DOMAIN || "";
  return domain.endsWith("/") ? domain.slice(0, -1) : domain;
};

/**
 * Uploads a file buffer to Cloudflare R2.
 * @param {Object|Buffer} file - Multer file object ({ buffer, mimetype, originalname, detectedMimeType }) or raw Buffer.
 * @param {string} [folder=""] - Target folder inside R2 bucket.
 * @returns {Promise<{ key: string, url: string }>} Upload result containing key and url.
 */
export const uploadToR2 = async (file, folder = "") => {
  if (!file) {
    throw new Error("No file provided for R2 upload");
  }

  let buffer;
  let mimeType = "application/octet-stream";
  let originalName = "";

  if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if (file && Buffer.isBuffer(file.buffer)) {
    buffer = file.buffer;
    mimeType = file.detectedMimeType || file.mimetype || file.mimeType || mimeType;
    originalName = file.originalname || file.name || "";
  } else {
    throw new Error("Invalid file format provided for R2 upload; buffer missing");
  }

  const ext = originalName ? path.extname(originalName).toLowerCase() : "";
  const uniqueId = crypto.randomUUID();
  const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "";
  const key = cleanFolder ? `${cleanFolder}/${uniqueId}${ext}` : `${uniqueId}${ext}`;

  const s3Client = getR2Client();
  const bucketName = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const publicDomain = getPublicDomain();
  const url = publicDomain ? `${publicDomain}/${key}` : key;

  return { key, url };
};

/**
 * Deletes a file from Cloudflare R2 by file key.
 * @param {string} fileKey - Key of the file in R2.
 * @returns {Promise<boolean>} True if deletion succeeded.
 */
export const deleteFromR2 = async (fileKey) => {
  if (!fileKey || typeof fileKey !== "string") {
    return false;
  }

  // If a full URL was provided, extract the relative key
  let cleanKey = fileKey;
  const publicDomain = getPublicDomain();
  if (publicDomain && cleanKey.startsWith(publicDomain)) {
    cleanKey = cleanKey.replace(`${publicDomain}/`, "");
  }

  try {
    const s3Client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: cleanKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`[deleteFromR2] Failed to delete file key ${cleanKey}:`, error);
    return false;
  }
};

/**
 * Generates a presigned download URL for private R2 objects (e.g., medical PDFs).
 * @param {string} fileKey - Key of the file in R2.
 * @param {number} [expiresInSeconds=3600] - URL validity in seconds.
 * @returns {Promise<string>} Presigned URL string.
 */
export const getPresignedR2Url = async (fileKey, expiresInSeconds = 3600) => {
  if (!fileKey || typeof fileKey !== "string") {
    throw new Error("File key is required to generate presigned URL");
  }

  let cleanKey = fileKey;
  const publicDomain = getPublicDomain();
  if (publicDomain && cleanKey.startsWith(publicDomain)) {
    cleanKey = cleanKey.replace(`${publicDomain}/`, "");
  }

  const s3Client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: cleanKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Resolves a file key or URL to a public URL or key.
 * @param {string} fileKeyOrUrl
 * @returns {string}
 */
export const getFileUrl = (fileKeyOrUrl) => {
  if (!fileKeyOrUrl) return "";
  if (fileKeyOrUrl.startsWith("http://") || fileKeyOrUrl.startsWith("https://")) {
    return fileKeyOrUrl;
  }
  const publicDomain = getPublicDomain();
  return publicDomain ? `${publicDomain}/${fileKeyOrUrl}` : fileKeyOrUrl;
};
