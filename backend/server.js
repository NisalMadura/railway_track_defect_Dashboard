const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let defects = [
  { id: 1, type: "Broken Rail", severity: "High", status: "Pending", location: "Colombo", assigned: "Team A" },
  { id: 2, type: "Corrosion", severity: "Medium", status: "In Progress", location: "Galle", assigned: "Team B" }
];

// Emit real-time updates
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("updateDefects", defects);
});

app.get("/defects", (req, res) => res.json(defects));

server.listen(5000, () => console.log("Server running on port 5000"));
