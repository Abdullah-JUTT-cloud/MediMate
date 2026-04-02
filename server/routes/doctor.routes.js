import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getProfile, getVerificationStatus, updateProfile, uploadProfilePicture,uploadPmdcCertificate, deleteAccount } from "../controllers/doctor.controller.js";
import upload, { verifyUploadedFileSignature } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getProfile);
router.get("/verification-status", verifyToken, getVerificationStatus);

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