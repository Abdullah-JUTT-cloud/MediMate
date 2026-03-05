import jwt from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token
  
  if(!token) {
    return res.status(401).json({ message: "Unauthorized - no token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.doctorId = decoded.id
    next()
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - invalid token" })
  }
}