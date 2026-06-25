import jwt from "jsonwebtoken";

// proverava da li je korisnik prijavljen (da li je poslao ispravan token)
export const requireAuth = (req, res, next) => {
  // token stize u zaglavlju kao "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Niste prijavljeni." });
  }

  // uzimamo samo deo posle reci "Bearer "
  const token = authHeader.split(" ")[1];

  try {
    // proveravamo da li je token validan i vadimo podatke iz njega
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, carrier }
    next(); // sve je ok, idemo dalje
  } catch (error) {
    return res.status(401).json({ message: "Token nije validan." });
  }
};

// dozvoljava pristup samo korisnicima sa odredjenom rolom
export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Nemate dozvolu za ovu akciju." });
    }
    next();
  };
};
