import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// pravi token za korisnika (vazi 7 dana)
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      carrier: user.carrier,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// registracija novog korisnika
export const register = async (req, res) => {
  try {
    const { username, password, role, carrier } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // provera da li korisnicko ime vec postoji
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // ako je rola "carrier", mora da se izabere koji je dostavljac
    if (role === "carrier" && !carrier) {
      return res
        .status(400)
        .json({ message: "Carrier must choose DHL, Hellman or Logwin." });
    }

    // hesiranje lozinke da se ne cuva kao obican tekst
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "user",
      carrier: role === "carrier" ? carrier : null,
    });
    await newUser.save();

    const token = createToken(newUser);
    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        username: newUser.username,
        role: newUser.role,
        carrier: newUser.carrier,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
};

// prijava (login) postojeceg korisnika
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Wrong username or password." });
    }

    // poredimo unetu lozinku sa hesiranom lozinkom iz baze
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Wrong username or password." });
    }

    const token = createToken(user);
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        username: user.username,
        role: user.role,
        carrier: user.carrier,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
};
