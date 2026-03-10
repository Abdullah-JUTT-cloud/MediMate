import express from "express";
import {
  getPatients,
  getPatient,
  addPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patient.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, getPatients);
router.get("/:id",verifyToken,getPatient);
router.post("/",verifyToken,addPatient);
router.put("/:id",verifyToken,updatePatient);
router.delete("/:id",verifyToken,deletePatient);

export default router;
