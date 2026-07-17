import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// loads the carrier configuration once, so every part of the backend
// (parser, models, validation, API) uses the same single source of truth
// adding a new carrier = adding one block to config/carriers.json, no code changes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "..", "config", "carriers.json");

export const { carriers } = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// just the names, e.g. ["DHL", "Hellman", "Logwin"]
export const carrierNames = carriers.map((carrier) => carrier.name);
