import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const requiredCloudinaryEnvVars = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

const missingCloudinaryEnvVars = Object.entries(requiredCloudinaryEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingCloudinaryEnvVars.length > 0) {
  console.error(
    `Missing required Cloudinary environment variables: ${missingCloudinaryEnvVars.join(", ")}`,
  );
  throw new Error("Cloudinary is misconfigured. Set the required environment variables before starting the server.");
}

cloudinary.config({
  cloud_name: requiredCloudinaryEnvVars.CLOUDINARY_CLOUD_NAME,
  api_key: requiredCloudinaryEnvVars.CLOUDINARY_API_KEY,
  api_secret: requiredCloudinaryEnvVars.CLOUDINARY_API_SECRET,
});

export default cloudinary;