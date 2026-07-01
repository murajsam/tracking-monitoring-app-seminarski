import jwt from "jsonwebtoken";

// checks if the user is logged in (sent a valid token)
export const requireAuth = (req, res, next) => {
  // token comes in the header as "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "You are not logged in." });
  }

  // take only the part after "Bearer "
  const token = authHeader.split(" ")[1];

  try {
    // verify the token and read its data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, carrier }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

// allows access only to users with a specific role
export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: "You don't have permission for this action." });
    }
    next();
  };
};
