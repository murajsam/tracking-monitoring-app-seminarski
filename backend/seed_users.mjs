// jednokratna skripta: migrira stare role i postavlja poznate naloge za demo/screenshotove
// pokretanje:  node seed_users.mjs
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.model.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tracking";

// nalozi koje uvek zelimo da postoje (sa poznatim lozinkama)
const demoUsers = [
  { username: "djordje", password: "djordje123", role: "user", carrier: null },
  { username: "dhl_user", password: "dhl123", role: "carrier", carrier: "DHL" },
  { username: "hellman_user", password: "hellman123", role: "carrier", carrier: "Hellman" },
  { username: "logwin_user", password: "logwin123", role: "carrier", carrier: "Logwin" },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to", MONGO_URI);

  // 1) migracija starih rola na nove nazive
  const m1 = await User.updateMany({ role: "korisnik" }, { $set: { role: "user" } });
  const m2 = await User.updateMany({ role: "dostavljac" }, { $set: { role: "carrier" } });
  console.log(`Migrated roles: korisnik->user (${m1.modifiedCount}), dostavljac->carrier (${m2.modifiedCount})`);

  // 2) upsert demo naloga sa hesiranom lozinkom
  for (const u of demoUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { username: u.username },
      { username: u.username, password: hashed, role: u.role, carrier: u.carrier },
      { upsert: true, new: true }
    );
    console.log(`Upserted: ${u.username} (${u.role}${u.carrier ? "/" + u.carrier : ""})`);
  }

  // 3) ispis svih korisnika radi provere
  const all = await User.find({}, "username role carrier");
  console.log("\nAll users:");
  all.forEach((x) => console.log(` - ${x.username} | ${x.role} | ${x.carrier || "-"}`));

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
