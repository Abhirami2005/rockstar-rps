import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Leaderboard Data (In-memory for now, can be Firebase)
  let leaderboard = [
    { name: "Alpha", wins: 42 },
    { name: "Beta", wins: 38 },
    { name: "Gamma", wins: 35 },
    { name: "Delta", wins: 29 },
    { name: "Epsilon", wins: 24 },
  ];

  // API Routes
  app.get("/api/leaderboard", (req, res) => {
    res.json(leaderboard.sort((a, b) => b.wins - a.wins).slice(0, 5));
  });

  app.post("/api/leaderboard", (req, res) => {
    const { name, wins } = req.body;
    if (name && typeof wins === 'number') {
      const existing = leaderboard.find(l => l.name === name);
      if (existing) {
        existing.wins = Math.max(existing.wins, wins);
      } else {
        leaderboard.push({ name, wins });
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
