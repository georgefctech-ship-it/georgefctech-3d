import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const CONFIG_FILE = path.join(process.cwd(), 'supabase-config.json');

  // API to get current database config
  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.key) {
          return res.json({ url: parsed.url, key: parsed.key, isCustom: true });
        }
      }
    } catch (e) {
      console.error("Error reading config file:", e);
    }

    // No custom config yet on the server
    return res.json({ url: null, key: null, isCustom: false });
  });

  // API to update database config
  app.post("/api/config", (req, res) => {
    try {
      const { url, key } = req.body;
      const config = { url: (url || '').trim(), key: (key || '').trim() };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error writing config file:", e);
      return res.status(500).json({ error: e.message });
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
