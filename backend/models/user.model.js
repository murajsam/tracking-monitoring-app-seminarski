import mongoose from "mongoose";

// model korisnika za prijavu i registraciju
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    // lozinka se cuva hesirano (nikad kao obican tekst)
    password: {
      type: String,
      required: true,
    },
    // dve role:
    //  - "user"    -> uploaduje fajlove i vidi sve posiljke
    //  - "carrier" -> vidi SAMO posiljke svog dostavljaca
    role: {
      type: String,
      enum: ["user", "carrier"],
      default: "user",
    },
    // koji je dostavljac u pitanju (samo za rolu "carrier"): DHL, Hellman ili Logwin
    carrier: {
      type: String,
      enum: ["DHL", "Hellman", "Logwin", null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
