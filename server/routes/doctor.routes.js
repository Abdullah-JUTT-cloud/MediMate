import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getProfile, updateProfile, uploadProfilePicture,uploadPmdcCertificate, deleteAccount } from "../controllers/doctor.controller.js";
import upload, { verifyUploadedFileSignature } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getProfile);

router.put("/update-profile", verifyToken, updateProfile);

router.post(
  "/upload-profile-picture",
  verifyToken,
  upload.single("profilePicture"),
  verifyUploadedFileSignature,
  uploadProfilePicture,
);

router.post(
  "/upload-pmdc-certificate",
  verifyToken,
  upload.single("pmdcCertificate"),
  verifyUploadedFileSignature,
  uploadPmdcCertificate,
);

router.delete("/delete-account", verifyToken, deleteAccount);

export default router;