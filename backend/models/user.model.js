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
    //  - "korisnik"   -> uploaduje fajlove i vidi sve posiljke
    //  - "dostavljac" -> vidi SAMO posiljke svog dostavljaca
    role: {
      type: String,
      enum: ["korisnik", "dostavljac"],
      default: "korisnik",
    },
    // koji je dostavljac u pitanju (samo za rolu "dostavljac"): DHL, Hellman ili Logwin
    carrier: {
      type: String,
      enum: ["DHL", "Hellman", "Logwin", null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
