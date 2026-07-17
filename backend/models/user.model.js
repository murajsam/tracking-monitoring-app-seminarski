import mongoose from "mongoose";
import { carrierNames } from "../utils/carrierConfig.js";

// user model for login and registration
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    // password is stored hashed (never as plain text)
    password: {
      type: String,
      required: true,
    },
    // two roles:
    //  - "user"    -> uploads files and sees all shipments
    //  - "carrier" -> sees ONLY its own carrier's shipments
    role: {
      type: String,
      enum: ["user", "carrier"],
      default: "user",
    },
    // which carrier this is (only for role "carrier") - list comes from the configuration
    carrier: {
      type: String,
      enum: [...carrierNames, null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
