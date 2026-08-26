import express from "express";
import { verifyAdminToken } from "../middlewares/admin.middleware.js";
import upload, { verifyUploadedFileSignature } from "../middlewares/upload.middleware.js";
import {
  approvePaymentProof,
  listPaymentProofs,
  rejectPaymentProof,
  submitPaymentProof,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.post(
  "/submit-proof",
  upload.single("screenshot"),
  verifyUploadedFileSignature,
  submitPaymentProof,
);

router.get("/proofs", verifyAdminToken, listPaymentProofs);
router.patch("/proofs/:id/approve", verifyAdminToken, approvePaymentProof);
router.patch("/proofs/:id/reject", verifyAdminToken, rejectPaymentProof);

export default router;
