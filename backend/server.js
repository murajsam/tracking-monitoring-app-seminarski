import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fileRoutes from "./routes/file.route.js";
import trackingRoutes from "./routes/tracking.route.js";

// load environment variables from .env file
dotenv.config();

// create express app
const app = express();

// enable cors (cross-origin resource sharing)
app.use(cors());

// parse request body as json
app.use(express.json());

// connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas!"))
  .catch((err) => console.error("Failed to connect:", err));

app.get("/", (req, res) => {
  res.send("Backend is running with ES Modules!");
});

// api routes
app.use("/api/files", fileRoutes); // route for file upload and tracking data import
app.use("/api/trackings", trackingRoutes); // route for getting tracking data from database

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
