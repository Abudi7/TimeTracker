import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import timeRoutes from "./routes/time.routes";
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/", (_, res) => res.send("Time Tracking API up"));

app.use("/auth", authRoutes);
app.use("/time", authMiddleware, timeRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
