const http = require("http");
const fs = require("fs");
const path = require("path");

const { fetchDefinition } = require("./lib/dictionary");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });

  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });

    res.end(data);
  });
}

function safePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);

  const relative =
    decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");

  const resolved = path.normalize(path.join(PUBLIC_DIR, relative));

  if (!resolved.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return resolved;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  try {
    if (url.pathname === "/api/define") {
      const word = url.searchParams.get("word");

      const result = await fetchDefinition(word);

      sendJson(res, result.status, result.body);
      return;
    }

    const filePath = safePublicPath(url.pathname);

    if (!filePath) {
      res.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end("Bad path");
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        sendFile(res, filePath);
        return;
      }

      sendFile(res, path.join(PUBLIC_DIR, "index.html"));
    });
  } catch (error) {
    console.error("Dictionary error:", error);

    sendJson(res, 502, {
      title: "The courier is late",
      message: "The dictionary service could not be reached.",
      error: error.message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Lexicon Scrapbook running at http://localhost:${PORT}`);
});