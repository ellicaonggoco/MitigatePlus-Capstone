const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/hazards", require("./routes/hazards"));
app.use("/api/assessments", require("./routes/assessments"));
app.use("/api/gobag", require("./routes/gobag"));
app.use("/api/evacuation", require("./routes/evacuation"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/routing", require("./routes/routing"));
app.use("/api/weather", require("./routes/weather"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "MitigatePlus API is running" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
