import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getCheckups,
  getCheckup,
  addCheckup,
  deleteCheckup,
} from "../controllers/checkup.controller.js";

const router = express.Router();

router.get("/single/:id", verifyToken, getCheckup);
router.get("/:id", verifyToken, getCheckups);

router.post("/:id", verifyToken, addCheckup);
router.delete("/:id", verifyToken, deleteCheckup);

export default router;