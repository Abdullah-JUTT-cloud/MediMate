import jwt from "jsonwebtoken";

export const verifyPatientToken = (req, res, next) => {
  const token = req.cookies.patientToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - no patient token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "patient") {
      return res.status(401).json({ message: "Unauthorized - invalid patient token" });
    }

    req.patientId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - invalid patient token" });
  }
};