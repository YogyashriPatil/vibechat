import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.route.js"
import { connectDB } from "./lib/db.js";
import messageRoutes from "./routes/message.route.js";
import {app,server} from "./lib/sockets.js"
import cors from "cors";

dotenv.config();
const __dirname = path.resolve();

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
const PORT=process.env.PORT || 5001;

console.log("PORT from .env:", process.env.PORT);
console.log("MONGODB_URI from .env:", process.env.MONGODB_URI);
app.use(cors({
    origin:"https://vibechat-2-z3lg.onrender.com",
    methods:["GET","POST","PUT","DELETE"],
    credentials:true,
    }
));

app.use("/api/auth",authRoutes);
app.use("/api/messages",messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}
connectDB()
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

server.listen(PORT, () => {
    console.log("Server is running on PORT:"+PORT);
    connectDB();
});
