import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// create a token for the user (valid for 7 days)
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

// register a new user
export const register = async (req, res) => {
  try {
    const { username, password, role, carrier } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // if the role is "carrier", a carrier must be selected
    if (role === "carrier" && !carrier) {
      return res
        .status(400)
        .json({ message: "Carrier must choose DHL, Hellman or Logwin." });
    }

    // hash the password so it isn't stored as plain text
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

// login an existing user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Wrong username or password." });
    }

    // compare the entered password with the hashed one from the database
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
