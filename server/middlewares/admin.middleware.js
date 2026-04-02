import jwt from "jsonwebtoken";

export const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - admin token missing" });
  }

  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    if (decoded?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - admin access required" });
    }

    req.admin = {
      email: decoded.email,
      name: decoded.name || process.env.ADMIN_NAME || "Admin",
      role: "admin",
    };

    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized - invalid admin token" });
  }
};

export const canAccessTicket = (ticket) => (req, res, next) => {
  const isAdmin = Boolean(req.admin?.role === "admin");
  const isOwnerDoctor = String(ticket.doctor) === String(req.doctorId);

  if (!isAdmin && !isOwnerDoctor) {
    return res.status(403).json({ message: "Forbidden" });
  }

  req.isAdmin = isAdmin;
  next();
};