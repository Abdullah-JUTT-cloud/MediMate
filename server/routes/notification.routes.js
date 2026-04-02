import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationsCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", verifyToken, listNotifications);
router.get("/unread-count", verifyToken, unreadNotificationsCount);
router.patch("/:id/read", verifyToken, markNotificationRead);
router.patch("/read-all", verifyToken, markAllNotificationsRead);

export default router;