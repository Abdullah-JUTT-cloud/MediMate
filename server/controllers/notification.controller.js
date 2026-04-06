import Notification from "../models/notification.model.js";

export const listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { doctor: req.doctorId };

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      notifications,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[listNotifications]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unreadNotificationsCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ doctor: req.doctorId, isRead: false });
    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("[unreadNotificationsCount]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, doctor: req.doctorId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("[markNotificationRead]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.deleteMany({ doctor: req.doctorId });
    return res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("[markAllNotificationsRead]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
